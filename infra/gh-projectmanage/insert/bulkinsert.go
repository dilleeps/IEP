// #!/usr/bin/env -S go run
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"
)

type IssueSpec struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Labels      string `json:"labels"`    // comma-separated: "bug,api"
	Assignees   string `json:"assignees"` // comma-separated: "user1,user2"
}

type Story struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	Body          string   `json:"body"`
	Labels        []string `json:"labels"`
	Estimate      int      `json:"estimate"`
	Priority      string   `json:"priority"`
	RelatedIssues []int    `json:"related_issues"`
}

type Metadata struct {
	GeneratedDate    string `json:"generated_date"`
	TotalStories     int    `json:"total_stories"`
	TotalStoryPoints int    `json:"total_story_points"`
	Source           string `json:"source"`
	Repository       string `json:"repository"`
	BoardURL         string `json:"boardUrl"`
}

type StoriesFile struct {
	Metadata Metadata `json:"metadata"`
	Stories  []Story  `json:"stories"`
}

type Result struct {
	IssueNum   string
	IssueURL   string
	Existed    bool
	Title      string
	Err        error
	StderrTail string
}

func main() {
	var (
		jsonStr  = flag.String("json", "", "Issue JSON object as string (e.g. '{\"title\":\"...\"}')")
		jsonFile = flag.String("in", "", "Path to JSON file (single issue or stories format)")
		repo     = flag.String("repo", "", "GitHub repo (owner/name) - auto-detected from stories file")
		owner    = flag.String("owner", "", "Org/user owning the project - auto-detected from repo")
		project  = flag.Int("project", 0, "Project number - auto-detected from boardUrl")
		timeout  = flag.Duration("timeout", 90*time.Second, "Timeout per issue")
		dryRun   = flag.Bool("dry-run", false, "Print commands, do not execute")
	)
	flag.Parse()

	if err := requireCmd("gh"); err != nil {
		fatal(err)
	}

	// Check if input is stories file format or single issue
	specs, repoName, ownerName, projectNum, err := loadIssues(*jsonStr, *jsonFile)
	if err != nil {
		fatal(err)
	}

	// Override with command line args if provided
	if *repo != "" {
		repoName = *repo
	}
	if *owner != "" {
		ownerName = *owner
	}
	if *project != 0 {
		projectNum = *project
	}

	if repoName == "" {
		fatal(errors.New("repository not specified (use -repo or provide in metadata)"))
	}
	if ownerName == "" {
		fatal(errors.New("owner not specified (use -owner or provide in metadata)"))
	}
	if projectNum == 0 {
		fatal(errors.New("project number not specified (use -project or provide boardUrl in metadata)"))
	}

	// Helpful auth sanity (non-fatal)
	_ = runSimple(context.Background(), *dryRun, "gh", "auth", "status")

	// Step 1: Get all existing labels and create missing ones
	if *jsonFile != "" {
		requiredLabels, err := extractLabelsFromFile(*jsonFile)
		if err == nil && len(requiredLabels) > 0 {
			fmt.Printf("Found %d unique label(s) required...\n", len(requiredLabels))

			// Get existing labels from repo
			existingLabels := getExistingLabels(context.Background(), *dryRun, repoName)
			existingSet := make(map[string]bool)
			for _, label := range existingLabels {
				existingSet[strings.ToLower(label)] = true
			}

			// Filter out labels that already exist
			labelsToCreate := []string{}
			for _, label := range requiredLabels {
				if !existingSet[strings.ToLower(label)] {
					labelsToCreate = append(labelsToCreate, label)
				}
			}

			if len(labelsToCreate) > 0 {
				fmt.Printf("Creating %d new label(s) in %s...\n\n", len(labelsToCreate), repoName)
				createLabels(context.Background(), *dryRun, labelsToCreate, repoName)
			} else {
				fmt.Printf("All labels already exist.\n")
			}
			fmt.Println()
		}
	}

	// Step 2: Create issues
	fmt.Printf("Processing %d issue(s) for %s (project #%d)...\n\n", len(specs), repoName, projectNum)

	var succeeded, failed, skipped int
	for i, spec := range specs {
		fmt.Printf("[%d/%d] ", i+1, len(specs))

		ctx, cancel := context.WithTimeout(context.Background(), *timeout)
		res := processOne(ctx, *dryRun, spec, repoName, ownerName, projectNum)
		cancel()

		if res.Err != nil {
			fmt.Fprintf(os.Stderr, "✗ %s\n  error: %v\n", res.Title, res.Err)
			if res.StderrTail != "" {
				fmt.Fprintf(os.Stderr, "  gh stderr: %s\n", res.StderrTail)
			}
			failed++
		} else if res.Existed {
			fmt.Printf("↺ Reused existing issue #%s: %s\n", res.IssueNum, res.Title)
			if res.IssueURL != "" {
				fmt.Printf("  %s\n", res.IssueURL)
			}
			skipped++
		} else {
			fmt.Printf("✓ Created issue #%s: %s\n", res.IssueNum, res.Title)
			if res.IssueURL != "" {
				fmt.Printf("  %s\n", res.IssueURL)
			}
			succeeded++
		}
		fmt.Println()
	}

	fmt.Printf("\n=== Summary ===\n")
	fmt.Printf("Created: %d\n", succeeded)
	fmt.Printf("Skipped (already exists): %d\n", skipped)
	fmt.Printf("Failed: %d\n", failed)
	fmt.Printf("Total: %d\n", len(specs))

	if failed > 0 {
		os.Exit(1)
	}
}

func loadIssues(jsonStr, jsonFile string) ([]IssueSpec, string, string, int, error) {
	if jsonStr != "" && jsonFile != "" {
		return nil, "", "", 0, errors.New("use only one of -json or -in")
	}
	if jsonStr == "" && jsonFile == "" {
		return nil, "", "", 0, errors.New("provide either -json or -in")
	}

	var b []byte
	var err error

	if jsonStr != "" {
		b = []byte(jsonStr)
	} else {
		b, err = os.ReadFile(jsonFile)
		if err != nil {
			return nil, "", "", 0, err
		}
	}

	// Try to parse as StoriesFile first
	var storiesFile StoriesFile
	if err := json.Unmarshal(b, &storiesFile); err == nil && len(storiesFile.Stories) > 0 {
		// Convert stories to IssueSpecs
		specs := make([]IssueSpec, 0, len(storiesFile.Stories))
		for _, story := range storiesFile.Stories {
			if strings.TrimSpace(story.Title) == "" {
				continue
			}
			spec := storyToIssueSpec(story)
			specs = append(specs, spec)
		}

		// Extract repo and owner from metadata
		repo := storiesFile.Metadata.Repository
		owner := ""
		if parts := strings.Split(repo, "/"); len(parts) == 2 {
			owner = parts[0]
		}

		// Extract project number from boardUrl
		projectNum := extractProjectNumber(storiesFile.Metadata.BoardURL)

		return specs, repo, owner, projectNum, nil
	}

	// Fall back to single issue format
	var spec IssueSpec
	if err := json.Unmarshal(b, &spec); err != nil {
		return nil, "", "", 0, fmt.Errorf("invalid JSON (not stories format or single issue): %w", err)
	}
	if strings.TrimSpace(spec.Title) == "" {
		return nil, "", "", 0, errors.New("missing required field: title")
	}
	return []IssueSpec{spec}, "", "", 0, nil
}

func storyToIssueSpec(story Story) IssueSpec {
	// Build body with estimate and related issues
	body := story.Body
	if story.Estimate > 0 {
		body += fmt.Sprintf("\n\n**Estimate:** %d story points", story.Estimate)
	}
	if len(story.RelatedIssues) > 0 {
		body += "\n\n**Related Issues:**"
		for _, issue := range story.RelatedIssues {
			body += fmt.Sprintf(" #%d", issue)
		}
	}

	// Add priority to labels if present
	labels := append([]string{}, story.Labels...)
	if story.Priority != "" {
		labels = append(labels, "priority:"+strings.ToLower(story.Priority))
	}

	return IssueSpec{
		Title:       story.Title,
		Description: body,
		Labels:      strings.Join(labels, ","),
		Assignees:   "",
	}
}

func extractProjectNumber(boardURL string) int {
	if boardURL == "" {
		return 0
	}
	// Extract from URL like https://github.com/orgs/ASKIEP/projects/1/views/1
	parts := strings.Split(boardURL, "/projects/")
	if len(parts) < 2 {
		return 0
	}
	projectParts := strings.Split(parts[1], "/")
	if len(projectParts) < 1 {
		return 0
	}
	var projectNum int
	fmt.Sscanf(projectParts[0], "%d", &projectNum)
	return projectNum
}

func extractLabelsFromFile(jsonFile string) ([]string, error) {
	b, err := os.ReadFile(jsonFile)
	if err != nil {
		return nil, err
	}

	var storiesFile StoriesFile
	if err := json.Unmarshal(b, &storiesFile); err != nil {
		return nil, err
	}

	// Extract unique labels
	labelSet := make(map[string]bool)
	for _, story := range storiesFile.Stories {
		for _, label := range story.Labels {
			if trimmed := strings.TrimSpace(label); trimmed != "" {
				labelSet[trimmed] = true
			}
		}
		// Add priority as label if present
		if story.Priority != "" {
			priorityLabel := "priority:" + strings.ToLower(story.Priority)
			labelSet[priorityLabel] = true
		}
	}

	// Convert to slice
	labels := make([]string, 0, len(labelSet))
	for label := range labelSet {
		labels = append(labels, label)
	}

	return labels, nil
}

func getExistingLabels(ctx context.Context, dryRun bool, repo string) []string {
	args := []string{
		"label", "list",
		"--repo", repo,
		"--limit", "1000",
		"--json", "name",
	}

	out, _, err := run(ctx, dryRun, "gh", args...)
	if err != nil {
		// If error, return empty list - we'll try to create all labels
		return []string{}
	}

	if dryRun {
		// In dry-run mode, return empty to show all labels would be created
		return []string{}
	}

	var labels []struct {
		Name string `json:"name"`
	}
	if err := json.Unmarshal([]byte(out), &labels); err != nil {
		return []string{}
	}

	result := make([]string, len(labels))
	for i, label := range labels {
		result[i] = label.Name
	}
	return result
}

func createLabels(ctx context.Context, dryRun bool, labels []string, repo string) {
	for _, label := range labels {
		color := generateColor(label)
		createArgs := []string{
			"label", "create",
			"--repo", repo,
			label,
		}
		// Only add color if specified
		if color != "" {
			createArgs = append(createArgs, "--color", color)
		}
		createArgs = append(createArgs, "--force") // Update if exists

		_, _, _ = run(ctx, dryRun, "gh", createArgs...)
		// Ignore errors - labels might already exist
	}
}

func generateColor(label string) string {
	// Only assign colors to specific important labels
	labelLower := strings.ToLower(label)
	switch labelLower {
	case "priority:critical":
		return "B60205" // Dark red for critical
	case "priority:high":
		return "D73A4A" // Red for high
	case "priority:medium":
		return "FBCA04" // Yellow for medium
	case "mobile":
		return "0E8A16" // Green for mobile
	default:
		return "" // Let GitHub auto-assign color
	}
}

func processOne(ctx context.Context, dryRun bool, spec IssueSpec, repo, owner string, project int) Result {
	res := Result{Title: spec.Title}

	// 0) Check if issue already exists (exact title match)
	num, url, found, stderr0, err := findExistingIssue(ctx, dryRun, repo, spec.Title)
	if err != nil {
		res.Err = fmt.Errorf("search issue failed: %w", err)
		res.StderrTail = tail(stderr0, 400)
		return res
	}

	if found {
		res.IssueNum = num
		res.IssueURL = url
		res.Existed = true
	} else {
		// 1) Create issue
		createArgs := []string{
			"issue", "create",
			"--repo", repo,
			"--title", spec.Title,
			"--body", spec.Description,
		}
		// Add labels now that they've been created
		if lbl := strings.TrimSpace(spec.Labels); lbl != "" {
			// Split comma-separated labels and add each one separately
			labels := strings.Split(lbl, ",")
			for _, label := range labels {
				if trimmed := strings.TrimSpace(label); trimmed != "" {
					createArgs = append(createArgs, "--label", trimmed)
				}
			}
		}
		if asg := strings.TrimSpace(spec.Assignees); asg != "" {
			createArgs = append(createArgs, "--assignee", asg)
		}

		out, stderr, err := run(ctx, dryRun, "gh", createArgs...)
		if err != nil {
			res.Err = fmt.Errorf("create issue failed: %w", err)
			res.StderrTail = tail(stderr, 400)
			return res
		}

		// Parse URL from output (gh issue create returns the URL on success)
		// Example output: "https://github.com/owner/repo/issues/123"
		issueURL := strings.TrimSpace(out)
		res.IssueURL = issueURL

		// Extract issue number from URL
		parts := strings.Split(issueURL, "/issues/")
		if len(parts) == 2 {
			res.IssueNum = strings.TrimSpace(parts[1])
		}

		if res.IssueNum == "" {
			res.Err = fmt.Errorf("could not parse issue number from output: %q", out)
			res.StderrTail = tail(stderr, 400)
			return res
		}
	}

	// 2) Add issue to org project (idempotent-ish: if already added, gh may error; we handle by ignoring "already exists" patterns)
	addArgs := []string{
		"project", "item-add", fmt.Sprintf("%d", project),
		"--owner", owner,
		"--url", res.IssueURL,
	}
	_, stderr2, err := run(ctx, dryRun, "gh", addArgs...)
	if err != nil {
		// Some gh versions error if item already on project. We'll ignore common duplicates.
		low := strings.ToLower(stderr2)
		if !(strings.Contains(low, "already") && (strings.Contains(low, "added") || strings.Contains(low, "exists"))) {
			res.Err = fmt.Errorf("add to project failed: %w", err)
			res.StderrTail = tail(stderr2, 400)
			return res
		}
	}

	return res
}

func findExistingIssue(ctx context.Context, dryRun bool, repo, title string) (number, url string, found bool, stderr string, err error) {
	args := []string{
		"issue", "list",
		"--repo", repo,
		"--search", fmt.Sprintf("in:title \"%s\"", title),
		"--json", "number,title,url",
	}
	out, errOut, err := run(ctx, dryRun, "gh", args...)
	if err != nil {
		return "", "", false, errOut, err
	}

	var items []struct {
		Number int    `json:"number"`
		Title  string `json:"title"`
		URL    string `json:"url"`
	}
	if strings.TrimSpace(out) == "" {
		return "", "", false, "", nil
	}
	if err := json.Unmarshal([]byte(out), &items); err != nil {
		return "", "", false, errOut, err
	}

	want := strings.TrimSpace(title)
	for _, it := range items {
		if strings.TrimSpace(it.Title) == want {
			return fmt.Sprintf("%d", it.Number), it.URL, true, "", nil
		}
	}
	return "", "", false, "", nil
}

func requireCmd(name string) error {
	_, err := exec.LookPath(name)
	if err != nil {
		return fmt.Errorf("required command not found in PATH: %s", name)
	}
	return nil
}

func runSimple(ctx context.Context, dryRun bool, name string, args ...string) error {
	_, _, err := run(ctx, dryRun, name, args...)
	return err
}

func run(ctx context.Context, dryRun bool, name string, args ...string) (stdout string, stderr string, err error) {
	// Always print the command for debugging
	fmt.Fprintf(os.Stderr, "[DEBUG] Executing: %s %s\n", name, strings.Join(args, " "))

	if dryRun {
		fmt.Printf("[dry-run] %s %s\n", name, strings.Join(args, " "))
		return "", "", nil
	}

	cmd := exec.CommandContext(ctx, name, args...)
	var outb, errb bytes.Buffer
	cmd.Stdout = &outb
	cmd.Stderr = &errb
	err = cmd.Run()
	stdout = outb.String()
	stderr = errb.String()

	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		return stdout, stderr, fmt.Errorf("command timed out: %s %s", name, strings.Join(args, " "))
	}
	return stdout, stderr, err
}

func tail(s string, n int) string {
	s = strings.TrimSpace(s)
	if len(s) <= n {
		return s
	}
	return s[len(s)-n:]
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "Error:", err)
	os.Exit(1)
}

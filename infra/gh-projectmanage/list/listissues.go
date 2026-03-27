// #!/usr/bin/env -S go run
package main

import (
	"bytes"
	"context"
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

type ProjectItem struct {
	Content struct {
		Type       string     `json:"type"`
		Number     int        `json:"number"`
		Title      string     `json:"title"`
		Body       string     `json:"body"`
		URL        string     `json:"url"`
		Repository string     `json:"repository"`
		Labels     []Label    `json:"labels"`
		Assignees  []Assignee `json:"assignees"`
		CreatedAt  string     `json:"createdAt"`
		UpdatedAt  string     `json:"updatedAt"`
		ClosedAt   string     `json:"closedAt"`
	} `json:"content"`
	Status string `json:"status"`
}

type Label struct {
	Name string `json:"name"`
}

type Assignee struct {
	Login string `json:"login"`
}

type IssueDetail struct {
	Number    int        `json:"number"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	URL       string     `json:"url"`
	Labels    []Label    `json:"labels"`
	Assignees []Assignee `json:"assignees"`
	CreatedAt string     `json:"createdAt"`
	UpdatedAt string     `json:"updatedAt"`
	ClosedAt  string     `json:"closedAt"`
}

type ProjectResponse struct {
	Items []ProjectItem `json:"items"`
}

type Metadata struct {
	GeneratedDate    string `json:"generated_date"`
	TotalStories     int    `json:"total_stories"`
	TotalStoryPoints int    `json:"total_story_points"`
	Source           string `json:"source"`
	Repository       string `json:"repository"`
	BoardURL         string `json:"boardUrl"`
}

type MetadataFile struct {
	Metadata Metadata `json:"metadata"`
}

func main() {
	var (
		inputFile = flag.String("in", "", "Path to JSON file with metadata")
		owner     = flag.String("owner", "", "Org/user owning the project (auto-detected from metadata)")
		project   = flag.Int("project", 0, "Project number (auto-detected from boardUrl)")
		output    = flag.String("output", "project_issues.csv", "Output CSV file path")
		limit     = flag.Int("limit", 2000, "Maximum number of items to fetch")
	)
	flag.Parse()

	if err := requireCmd("gh"); err != nil {
		fatal(err)
	}

	// Load metadata from file if provided
	ownerName := *owner
	projectNum := *project

	if *inputFile != "" {
		meta, err := loadMetadata(*inputFile)
		if err != nil {
			fatal(err)
		}

		// Extract owner from repository if not provided
		if ownerName == "" {
			if parts := strings.Split(meta.Repository, "/"); len(parts) == 2 {
				ownerName = parts[0]
			}
		}

		// Extract project number from boardUrl if not provided
		if projectNum == 0 {
			projectNum = extractProjectNumber(meta.BoardURL)
		}
	}

	if ownerName == "" {
		fatal(fmt.Errorf("owner not specified (use -owner or provide in metadata file with -in)"))
	}
	if projectNum == 0 {
		fatal(fmt.Errorf("project number not specified (use -project or provide boardUrl in metadata file with -in)"))
	}

	fmt.Printf("Fetching issues from project #%d (owner: %s)...\n", projectNum, ownerName)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// Fetch project items
	items, err := fetchProjectItems(ctx, ownerName, projectNum, *limit)
	if err != nil {
		fatal(err)
	}

	// Filter for issues only
	issues := filterIssues(items)
	fmt.Printf("Found %d issues (filtered from %d total items)\n", len(issues), len(items))

	if len(issues) == 0 {
		fmt.Println("No issues found.")
		return
	}

	// Enrich issues with detailed information
	fmt.Println("Fetching detailed issue information...")
	repoName := strings.Split(issues[0].Content.Repository, "/")
	if len(repoName) == 2 {
		enrichIssues(ctx, issues, repoName[0]+"/"+repoName[1])
	}
	fmt.Println("Done fetching details.")

	// Write to CSV
	if err := writeCSV(*output, issues); err != nil {
		fatal(err)
	}

	fmt.Printf("✓ Exported %d issues to %s\n", len(issues), *output)
}

func loadMetadata(inputFile string) (Metadata, error) {
	b, err := os.ReadFile(inputFile)
	if err != nil {
		return Metadata{}, err
	}

	var metaFile MetadataFile
	if err := json.Unmarshal(b, &metaFile); err != nil {
		return Metadata{}, fmt.Errorf("invalid JSON: %w", err)
	}

	return metaFile.Metadata, nil
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

func fetchProjectItems(ctx context.Context, owner string, project int, limit int) ([]ProjectItem, error) {
	args := []string{
		"project", "item-list", fmt.Sprintf("%d", project),
		"--owner", owner,
		"--format", "json",
		"--limit", fmt.Sprintf("%d", limit),
	}

	fmt.Fprintf(os.Stderr, "[DEBUG] Executing: gh %s\n", strings.Join(args, " "))

	cmd := exec.CommandContext(ctx, "gh", args...)
	var outb, errb bytes.Buffer
	cmd.Stdout = &outb
	cmd.Stderr = &errb

	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("gh command failed: %w (stderr: %s)", err, errb.String())
	}

	var response ProjectResponse
	if err := json.Unmarshal(outb.Bytes(), &response); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	return response.Items, nil
}

func filterIssues(items []ProjectItem) []ProjectItem {
	issues := []ProjectItem{}
	for _, item := range items {
		if item.Content.Type == "Issue" {
			issues = append(issues, item)
		}
	}
	return issues
}

func enrichIssues(ctx context.Context, issues []ProjectItem, repo string) {
	const workers = 10   // Number of concurrent workers
	const batchSize = 10 // Minimum batch size

	if len(issues) == 0 {
		return
	}

	// Use worker pool for concurrent fetching
	jobs := make(chan int, len(issues))
	var wg sync.WaitGroup

	// Start worker pool
	for w := 0; w < workers; w++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for idx := range jobs {
				issueNum := issues[idx].Content.Number
				if issueNum == 0 {
					continue
				}

				args := []string{
					"issue", "view", fmt.Sprintf("%d", issueNum),
					"--repo", repo,
					"--json", "number,title,body,url,labels,assignees,createdAt,updatedAt,closedAt",
				}

				cmd := exec.CommandContext(ctx, "gh", args...)
				var outb bytes.Buffer
				cmd.Stdout = &outb

				err := cmd.Run()
				if err != nil {
					// Skip on error
					continue
				}

				var detail IssueDetail
				if err := json.Unmarshal(outb.Bytes(), &detail); err == nil {
					issues[idx].Content.Labels = detail.Labels
					issues[idx].Content.Assignees = detail.Assignees
					issues[idx].Content.CreatedAt = detail.CreatedAt
					issues[idx].Content.UpdatedAt = detail.UpdatedAt
					issues[idx].Content.ClosedAt = detail.ClosedAt
				}

				// Progress indicator
				if (idx+1)%batchSize == 0 || idx == len(issues)-1 {
					fmt.Fprintf(os.Stderr, "  Processed %d/%d issues\n", idx+1, len(issues))
				}
			}
		}()
	}

	// Send jobs
	for i := range issues {
		jobs <- i
	}
	close(jobs)

	// Wait for all workers to finish
	wg.Wait()
}

func writeCSV(filename string, issues []ProjectItem) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// First pass: collect all unique labels
	uniqueLabels := make(map[string]bool)
	for _, issue := range issues {
		for _, label := range issue.Content.Labels {
			uniqueLabels[label.Name] = true
		}
	}

	// Convert to sorted slice for consistent column order
	labelNames := make([]string, 0, len(uniqueLabels))
	for label := range uniqueLabels {
		labelNames = append(labelNames, label)
	}
	// Sort labels alphabetically
	sortLabels(labelNames)

	// Write header with dynamic label columns
	header := []string{"Number", "Title", "Description", "Labels", "Status", "Repository", "Assignees", "CreatedAt", "UpdatedAt", "ClosedAt", "URL"}
	header = append(header, labelNames...)
	if err := writer.Write(header); err != nil {
		return err
	}

	// Write data
	for _, issue := range issues {
		// Create label lookup map for this issue
		issueLabels := make(map[string]bool)
		allLabels := []string{}
		for _, label := range issue.Content.Labels {
			issueLabels[label.Name] = true
			allLabels = append(allLabels, label.Name)
		}
		labelsStr := strings.Join(allLabels, ";")

		// Collect assignee logins
		assigneeLogins := []string{}
		for _, assignee := range issue.Content.Assignees {
			assigneeLogins = append(assigneeLogins, assignee.Login)
		}
		assignees := strings.Join(assigneeLogins, ";")

		// Clean description - remove newlines and quotes
		description := strings.ReplaceAll(issue.Content.Body, "\n", " ")
		description = strings.ReplaceAll(description, "\r", " ")
		description = strings.TrimSpace(description)

		// Build row with base fields
		row := []string{
			fmt.Sprintf("%d", issue.Content.Number),
			issue.Content.Title,
			description,
			labelsStr,
			issue.Status,
			issue.Content.Repository,
			assignees,
			issue.Content.CreatedAt,
			issue.Content.UpdatedAt,
			issue.Content.ClosedAt,
			issue.Content.URL,
		}

		// Add label columns (X if present, empty if not)
		for _, labelName := range labelNames {
			if issueLabels[labelName] {
				row = append(row, "X")
			} else {
				row = append(row, "")
			}
		}

		if err := writer.Write(row); err != nil {
			return err
		}
	}

	return nil
}

// Simple bubble sort for label names
func sortLabels(labels []string) {
	n := len(labels)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if labels[j] > labels[j+1] {
				labels[j], labels[j+1] = labels[j+1], labels[j]
			}
		}
	}
}

func requireCmd(name string) error {
	_, err := exec.LookPath(name)
	if err != nil {
		return fmt.Errorf("required command not found in PATH: %s", name)
	}
	return nil
}

func fatal(err error) {
	fmt.Fprintln(os.Stderr, "Error:", err)
	os.Exit(1)
}

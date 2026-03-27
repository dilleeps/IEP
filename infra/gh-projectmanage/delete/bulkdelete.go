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
	Title      string
	IssueNum   string
	IssueURL   string
	Deleted    bool
	Err        error
	StderrTail string
}

func main() {
	var (
		jsonFile = flag.String("in", "", "Path to JSON file (stories format)")
		repo     = flag.String("repo", "", "GitHub repo (owner/name) - auto-detected from stories file")
		timeout  = flag.Duration("timeout", 90*time.Second, "Timeout per issue")
		dryRun   = flag.Bool("dry-run", false, "Print commands, do not execute")
	)
	flag.Parse()

	if err := requireCmd("gh"); err != nil {
		fatal(err)
	}

	titles, repoName, err := loadTitles(*jsonFile)
	if err != nil {
		fatal(err)
	}

	// Override with command line args if provided
	if *repo != "" {
		repoName = *repo
	}

	if repoName == "" {
		fatal(errors.New("repository not specified (use -repo or provide in metadata)"))
	}

	// Helpful auth sanity (non-fatal)
	_ = runSimple(context.Background(), *dryRun, "gh", "auth", "status")

	fmt.Printf("Deleting %d issue(s) from %s...\n\n", len(titles), repoName)

	var succeeded, failed, notFound int
	for i, title := range titles {
		fmt.Printf("[%d/%d] ", i+1, len(titles))

		ctx, cancel := context.WithTimeout(context.Background(), *timeout)
		res := deleteOne(ctx, *dryRun, title, repoName)
		cancel()

		if res.Err != nil {
			fmt.Fprintf(os.Stderr, "✗ %s\n  error: %v\n", res.Title, res.Err)
			if res.StderrTail != "" {
				fmt.Fprintf(os.Stderr, "  gh stderr: %s\n", res.StderrTail)
			}
			failed++
		} else if !res.Deleted {
			fmt.Printf("○ Not found: %s\n", res.Title)
			notFound++
		} else {
			fmt.Printf("✓ Deleted issue #%s: %s\n", res.IssueNum, res.Title)
			if res.IssueURL != "" {
				fmt.Printf("  %s\n", res.IssueURL)
			}
			succeeded++
		}
		fmt.Println()
	}

	fmt.Printf("\n=== Summary ===\n")
	fmt.Printf("Deleted: %d\n", succeeded)
	fmt.Printf("Not found: %d\n", notFound)
	fmt.Printf("Failed: %d\n", failed)
	fmt.Printf("Total: %d\n", len(titles))

	if failed > 0 {
		os.Exit(1)
	}
}

func loadTitles(jsonFile string) ([]string, string, error) {
	if jsonFile == "" {
		return nil, "", errors.New("provide -in with stories JSON file")
	}

	b, err := os.ReadFile(jsonFile)
	if err != nil {
		return nil, "", err
	}

	// Parse as StoriesFile
	var storiesFile StoriesFile
	if err := json.Unmarshal(b, &storiesFile); err != nil {
		return nil, "", fmt.Errorf("invalid JSON: %w", err)
	}

	if len(storiesFile.Stories) == 0 {
		return nil, "", errors.New("no stories found in file")
	}

	// Extract titles
	titles := make([]string, 0, len(storiesFile.Stories))
	for _, story := range storiesFile.Stories {
		if strings.TrimSpace(story.Title) != "" {
			titles = append(titles, story.Title)
		}
	}

	// Extract repo from metadata
	repo := storiesFile.Metadata.Repository

	return titles, repo, nil
}

func deleteOne(ctx context.Context, dryRun bool, title, repo string) Result {
	res := Result{Title: title}

	// 1) Find existing issue
	num, url, found, stderr0, err := findExistingIssue(ctx, dryRun, repo, title)
	if err != nil {
		res.Err = fmt.Errorf("search issue failed: %w", err)
		res.StderrTail = tail(stderr0, 400)
		return res
	}

	if !found {
		// Issue doesn't exist, nothing to delete
		res.Deleted = false
		return res
	}

	res.IssueNum = num
	res.IssueURL = url

	// 2) Delete the issue
	deleteArgs := []string{
		"issue", "delete",
		"--repo", repo,
		num,
		"--yes", // Confirm deletion
	}

	_, stderr, err := run(ctx, dryRun, "gh", deleteArgs...)
	if err != nil {
		res.Err = fmt.Errorf("delete issue failed: %w", err)
		res.StderrTail = tail(stderr, 400)
		return res
	}

	res.Deleted = true
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

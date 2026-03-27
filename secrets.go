package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type SecretTask struct {
	Key   string
	Value string
}

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run secrets.go <path-to-.env-file>")
	}

	envFilePath := os.Args[1]

	repo := os.Getenv("GITHUB_REPO")
	environment := os.Getenv("GITHUB_ENVIRONMENT")

	if repo == "" {
		log.Fatal("GITHUB_REPO environment variable is required")
	}
	if environment == "" {
		log.Fatal("GITHUB_ENVIRONMENT environment variable is required")
	}

	fmt.Printf("Setting secrets for repo: %s, environment: %s\n", repo, environment)

	tasks, err := parseEnvIntoTasks(envFilePath, repo, environment)
	if err != nil {
		log.Fatalf("Error processing .env file: %v", err)
	}

	// Tune this: 4-8 is usually sweet spot (avoids GitHub throttling + CPU churn)
	workers := 6
	if v := os.Getenv("SECRETS_WORKERS"); v != "" {
		// optional: parse int, ignore errors for brevity
	}

	start := time.Now()
	if err := runTasksConcurrently(tasks, workers, repo, environment); err != nil {
		log.Fatalf("Failed setting secrets: %v", err)
	}

	fmt.Printf("All secrets set successfully! (%d secrets) in %s\n", len(tasks), time.Since(start))
}

func parseEnvIntoTasks(envFilePath, repo, environment string) ([]SecretTask, error) {
	if _, err := os.Stat(envFilePath); os.IsNotExist(err) {
		return nil, fmt.Errorf(".env file not found: %s", envFilePath)
	}

	f, err := os.Open(envFilePath)
	if err != nil {
		return nil, fmt.Errorf("error opening .env file: %v", err)
	}
	defer f.Close()

	scanner := bufio.NewScanner(f)
	// Avoid scanner choking on long secrets
	buf := make([]byte, 0, 1024*1024)
	scanner.Buffer(buf, 10*1024*1024)

	var tasks []SecretTask

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		// Remove trailing comments only (# preceded by whitespace)
		// This preserves # within values like passwords or URLs
		if idx := strings.Index(value, " #"); idx >= 0 {
			value = value[:idx]
			value = strings.TrimSpace(value)
		} else if idx := strings.Index(value, "\t#"); idx >= 0 {
			value = value[:idx]
			value = strings.TrimSpace(value)
		}

		if key == "GITHUB_TOKEN" || key == "GOOGLE_APPLICATION_CREDENTIALS" {
			fmt.Printf("Skipping %s (local use only)\n", key)
			continue
		}

		// Remove quotes if present
		value = strings.Trim(value, "\"'")

		if key == "GCP_SA_KEY_FILE_PATH" {
			secretValue, err := readFileExpandTilde(value)
			if err != nil {
				return nil, fmt.Errorf("error reading GCP key file from %s: %v", value, err)
			}
			secretValue = strings.TrimSpace(secretValue)
			if !strings.HasPrefix(secretValue, "{") {
				return nil, fmt.Errorf("GCP key file does not look like JSON: %s", value)
			}
			tasks = append(tasks, SecretTask{Key: "GCP_SA_KEY", Value: secretValue})
			continue
		}

		if key == "SSH_KEY_PATH" {
			secretValue, err := readFileExpandTilde(value)
			if err != nil {
				// keep your original behavior: warn but don't fail
				fmt.Printf("Warning: error setting SSH private key from %s: %v\n", value, err)
				continue
			}
			tasks = append(tasks, SecretTask{Key: "SSH_PRIVATE_KEY", Value: secretValue})
			continue
		}

		tasks = append(tasks, SecretTask{Key: key, Value: value})
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return tasks, nil
}

func readFileExpandTilde(path string) (string, error) {
	if strings.HasPrefix(path, "~/") {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", fmt.Errorf("error getting home directory: %v", err)
		}
		path = filepath.Join(home, path[2:])
	}
	path = filepath.Clean(path)

	b, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func runTasksConcurrently(tasks []SecretTask, workers int, repo, environment string) error {
	if workers < 1 {
		workers = 1
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	taskCh := make(chan SecretTask)
	errCh := make(chan error, 1)

	var wg sync.WaitGroup
	workerFn := func() {
		defer wg.Done()
		for t := range taskCh {
			if err := setGitHubSecret(ctx, t.Key, t.Value, repo, environment); err != nil {
				// first error wins; cancel context to stop other work ASAP
				select {
				case errCh <- err:
					cancel()
				default:
				}
				return
			}
		}
	}

	wg.Add(workers)
	for i := 0; i < workers; i++ {
		go workerFn()
	}

	go func() {
		defer close(taskCh)
		for _, t := range tasks {
			select {
			case <-ctx.Done():
				return
			case taskCh <- t:
			}
		}
	}()

	wg.Wait()

	select {
	case err := <-errCh:
		return err
	default:
		return nil
	}
}

func setGitHubSecret(ctx context.Context, key, value, repo, environment string) error {
	fmt.Printf("Setting secret: %s\n", key)

	cmd := exec.CommandContext(ctx, "gh", "secret", "set", key, "--env", environment, "--repo", repo)
	cmd.Stdin = strings.NewReader(value)

	out, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("gh secret set failed for %s: %v, output: %s", key, err, string(out))
	}

	fmt.Printf("✓ Successfully set secret: %s\n", key)
	return nil
}

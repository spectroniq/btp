package scraper

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"
)

type Job struct {
	Title       string    `json:"title"`
	Company     string    `json:"company"`
	Location    string    `json:"location"`
	URL         string    `json:"url"`
	Description string    `json:"description"`
	Tags        []string  `json:"tags"`
	Source      string    `json:"source"`
	PostedAt    time.Time `json:"postedAt"`
}

type Scraper struct {
	apiKey     string
	gatewayURL string
	client     *http.Client
}

func New() *Scraper {
	return &Scraper{
		apiKey:     os.Getenv("SERPAPI_KEY"),
		gatewayURL: os.Getenv("GATEWAY_URL"),
		client:     &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *Scraper) Run(query string) error {
	log.Printf("Scraping jobs for: %s", query)

	jobs, err := s.fetchJobs(query)
	if err != nil {
		return fmt.Errorf("fetch failed: %w", err)
	}

	log.Printf("Found %d jobs", len(jobs))

	if err := s.postToGateway(jobs); err != nil {
		return fmt.Errorf("post to gateway failed: %w", err)
	}

	return nil
}

func (s *Scraper) fetchJobs(query string) ([]Job, error) {
	url := fmt.Sprintf(
		"https://serpapi.com/search.json?engine=google_jobs&q=%s&api_key=%s",
		url.QueryEscape(query), s.apiKey,
	)

	resp, err := s.client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Jobs []struct {
			Title          string `json:"title"`
			CompanyName    string `json:"company_name"`
			Location       string `json:"location"`
			ShareLink      string `json:"share_link"`
			Description    string `json:"description"`
			DetectedExtensions struct {
				PostedAt string `json:"posted_at"`
			} `json:"detected_extensions"`
		} `json:"jobs_results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	jobs := make([]Job, 0, len(result.Jobs))
	for _, j := range result.Jobs {
		jobs = append(jobs, Job{
			Title:       j.Title,
			Company:     j.CompanyName,
			Location:    j.Location,
			URL:         j.ShareLink,
			Description: j.Description,
			Tags:        []string{},
			Source:      "serpapi",
			PostedAt:    time.Now(),
		})
	}

	return jobs, nil
}

func (s *Scraper) postToGateway(jobs []Job) error {
	payload, err := json.Marshal(map[string]any{"jobs": jobs})
	if err != nil {
		return err
	}

	resp, err := s.client.Post(
		s.gatewayURL+"/api/v1/jobs/ingest",
		"application/json",
		bytes.NewBuffer(payload),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("gateway returned %d", resp.StatusCode)
	}

	return nil
}
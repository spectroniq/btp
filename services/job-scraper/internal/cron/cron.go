package cron

import (
	"log"
	"time"

	"github.com/kingsleydaprime/btp/services/job-scraper/internal/scraper"
)

type queryConfig struct {
	query string
	tags  []string
}

var queries = []queryConfig{
	{"software engineer big tech", []string{"Software Engineer"}},
	{"backend engineer Google Microsoft Meta Apple Amazon", []string{"Backend"}},
	{"frontend engineer Google Microsoft Meta Apple Amazon", []string{"Frontend"}},
	{"ML engineer remote", []string{"ML Engineer"}},
	{"DevOps engineer cloud AWS GCP Azure", []string{"DevOps"}},
}

type Scheduler struct {
	scraper *scraper.Scraper
}

func New(s *scraper.Scraper) *Scheduler {
	return &Scheduler{scraper: s}
}

func (c *Scheduler) Start() {
	go c.runNow()
	go c.runDaily()
}

func (c *Scheduler) runNow() {
	c.scrapeAll()
}

func (c *Scheduler) runDaily() {
	ticker := time.NewTicker(24 * time.Hour)
	for range ticker.C {
		c.scrapeAll()
	}
}

func (c *Scheduler) ScrapeAll() {
	for _, q := range queries {
		if err := c.scraper.Run(q.query, q.tags); err != nil {
			log.Printf("scrape error for %q: %v", q.query, err)
		}
	}
}

func (c *Scheduler) scrapeAll() {
	c.ScrapeAll()
}

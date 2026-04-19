package cron

import (
	"log"
	"time"

	"github.com/kingsleydaprime/btp/services/job-scraper/internal/scraper"
)

var queries = []string{
	"software engineer big tech",
	"backend engineer Google Microsoft Meta",
	"ML engineer remote",
	"DevOps engineer AWS",
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

func (c *Scheduler) scrapeAll() {
	for _, q := range queries {
		if err := c.scraper.Run(q); err != nil {
			log.Printf("scrape error for %q: %v", q, err)
		}
	}
}
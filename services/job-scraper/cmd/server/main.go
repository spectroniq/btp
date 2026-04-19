package main

import (
	"log"
	"net/http"

	"github.com/kingsleydaprime/btp/services/job-scraper/internal/cron"
	"github.com/kingsleydaprime/btp/services/job-scraper/internal/scraper"
)

func main() {
	log.Println("BTP Job Scraper — starting")

	scraper := scraper.New()
	scheduler := cron.New(scraper)
	scheduler.Start()

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","service":"job-scraper"}`))
	})

	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
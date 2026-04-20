package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/kingsleydaprime/btp/services/job-scraper/internal/cron"
	"github.com/kingsleydaprime/btp/services/job-scraper/internal/scraper"
)

func main() {
	log.Println("BTP Job Scraper — starting")

	s := scraper.New()
	scheduler := cron.New(s)
	scheduler.Start()

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok","service":"job-scraper"}`))
	})

	http.HandleFunc("/trigger", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		log.Println("Manual trigger received")
		go scheduler.ScrapeAll()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "ok",
			"message": "scrape triggered",
		})
	})

	log.Println("Listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
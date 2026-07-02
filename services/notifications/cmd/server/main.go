package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
)

type NotifyRequest struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	Html    string `json:"html"`
}

type DigestJob struct {
	Title   string `json:"title"`
	Company string `json:"company"`
	URL     string `json:"url"`
}

type DigestRequest struct {
	To   string      `json:"to"`
	Jobs []DigestJob `json:"jobs"`
}

func sendEmail(to, subject, html string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		log.Printf("[email skipped — no RESEND_API_KEY] to=%s subject=%s", to, subject)
		return nil
	}
	from := os.Getenv("EMAIL_FROM")
	if from == "" {
		from = "BTP <noreply@bigtech.prep>"
	}

	body, _ := json.Marshal(map[string]any{
		"from":    from,
		"to":      []string{to},
		"subject": subject,
		"html":    html,
	})

	req, err := http.NewRequest(http.MethodPost, "https://api.resend.com/emails", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend returned %d", resp.StatusCode)
	}
	log.Printf("email sent to=%s subject=%s", to, subject)
	return nil
}

func handleNotify(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req NotifyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.To == "" || req.Subject == "" {
		http.Error(w, "to and subject required", http.StatusBadRequest)
		return
	}
	if err := sendEmail(req.To, req.Subject, req.Html); err != nil {
		log.Printf("email error: %v", err)
		http.Error(w, "failed to send email", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "sent"})
}

func handleDigest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req DigestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid body", http.StatusBadRequest)
		return
	}
	if req.To == "" || len(req.Jobs) == 0 {
		http.Error(w, "to and jobs required", http.StatusBadRequest)
		return
	}

	html := "<h2 style='font-family:sans-serif;color:#fff;background:#0d0d0f;padding:24px;margin:0'>New Jobs on BTP</h2><div style='font-family:sans-serif;padding:24px;background:#141418'>"
	for _, j := range req.Jobs {
		html += fmt.Sprintf(
			"<div style='margin-bottom:16px;padding:16px;background:#1a1a1f;border-radius:8px;border:1px solid #ffffff10'>"+
				"<p style='margin:0;color:#fff;font-weight:600'>%s</p>"+
				"<p style='margin:4px 0 0;color:#ffffff60;font-size:14px'>%s</p>"+
				"<a href='%s' style='display:inline-block;margin-top:8px;font-size:12px;color:#1B6CF2'>View Job →</a>"+
				"</div>",
			j.Title, j.Company, j.URL,
		)
	}
	html += "</div>"

	subject := fmt.Sprintf("%d new jobs on BTP", len(req.Jobs))
	if err := sendEmail(req.To, subject, html); err != nil {
		log.Printf("digest error: %v", err)
		http.Error(w, "failed to send digest", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "sent"})
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}
	log.Println("BTP Notifications — starting")

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "notifications"})
	})

	http.HandleFunc("/notify", handleNotify)
	http.HandleFunc("/digest", handleDigest)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	log.Printf("Listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

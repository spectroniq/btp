# Learning Notes — Go Job Scraper

Things I learned and concepts I should understand — this is my first real Go project.

---

## Go Fundamentals

### Packages and `main`

Every Go file starts with `package <name>`. The package named `main` is special — it's the entry point:

```go
package main

func main() {
    // program starts here
}
```

Other packages (like `scraper`, `cron`) are libraries. The `cmd/server/main.go` path is a Go convention:
- `cmd/` — executable entry points
- `internal/` — packages only this module can import (Go enforces this)

### Imports

```go
import (
    "fmt"           // standard library — printf-style formatting
    "net/http"      // standard library — HTTP client + server
    "os"            // standard library — env vars, file system

    "github.com/joho/godotenv"  // third-party — loads .env files
    "github.com/kingsleydaprime/btp/services/job-scraper/internal/scraper"  // local package
)
```

Unlike JavaScript/Python, Go imports are always by full path. Unused imports are **compile errors**.

---

## Pointers: `*` and `&`

This is the most confusing thing coming from JS/Python. Go has explicit pointers.

### `&` — address-of (get a pointer TO something)

```go
s := Scraper{apiKey: "abc"}
ptr := &s   // ptr is now a *Scraper — a pointer to s
```

`&x` means "give me the memory address where `x` lives".

### `*` — dereference (two meanings)

**In a type** — `*Scraper` means "a pointer to a Scraper":

```go
type Scheduler struct {
    scraper *scraper.Scraper  // holds a pointer, not a copy
}
```

**On a value** — `*ptr` means "give me what this pointer points to":

```go
val := *ptr  // follows the pointer, gets the actual Scraper
```

### Why pointers in this codebase?

```go
func New() *Scraper {
    return &Scraper{
        apiKey:     os.Getenv("SERPAPI_KEY"),
        gatewayURL: os.Getenv("GATEWAY_URL"),
        client:     &http.Client{Timeout: 10 * time.Second},
    }
}
```

`New()` returns a `*Scraper` (pointer) so:
1. Callers share the same object — no expensive copy
2. Methods with pointer receivers can modify the original

If this returned `Scraper` (no pointer), callers would get a full copy of the struct.

---

## Structs and Methods

Go has no classes. You define data with `struct` and attach behavior with methods:

```go
// Define the data shape
type Scraper struct {
    apiKey     string
    gatewayURL string
    client     *http.Client
}

// Attach a method with a "receiver"
func (s *Scraper) Run(query string) error {
    // s is like "this" in other languages
    log.Printf("Scraping: %s", query)
    return s.fetchJobs(query)
}

// Call it:
scraper := New()
err := scraper.Run("software engineer")
```

`(s *Scraper)` is the **receiver** — it's what makes this a method of `Scraper`. The `*` means it receives a pointer (can modify the struct; also avoids copying it).

---

## Error Handling

Go has no exceptions. Functions return errors as values:

```go
func (s *Scraper) fetchJobs(query string) ([]Job, error) {
    resp, err := s.client.Get(url)
    if err != nil {
        return nil, err   // propagate the error up
    }
    defer resp.Body.Close()
    // ...
    return jobs, nil  // success: return value and nil error
}
```

**Pattern**: always check `err != nil` immediately after a call that can fail. `nil` means no error.

### `fmt.Errorf` — wrapping errors

```go
return fmt.Errorf("fetch failed: %w", err)
```

`%w` wraps the original error — the caller can unwrap it with `errors.Is()` or `errors.As()`. This adds context without losing the original error.

---

## JSON in Go

### Struct tags

The backtick annotations tell Go how to map struct fields to JSON:

```go
type Job struct {
    Title    string    `json:"title"`     // maps to "title" in JSON
    Company  string    `json:"company"`
    PostedAt time.Time `json:"postedAt"`  // auto-serialized to ISO string
}
```

Without the tag, Go uses the field name as-is (`Title` would serialize to `"Title"` with capital T).

### Anonymous struct for decoding

When you only need a struct once for parsing, you can define it inline:

```go
var result struct {
    Jobs []struct {
        Title       string `json:"title"`
        CompanyName string `json:"company_name"`
    } `json:"jobs_results"`
}

json.NewDecoder(resp.Body).Decode(&result)
```

`Decode(&result)` fills `result` from the JSON — `&` is needed because Decode needs a pointer to modify the value.

---

## Goroutines and Concurrency

### `go` keyword — run in background

```go
go scheduler.ScrapeAll()  // starts ScrapeAll in a goroutine (non-blocking)
```

This is like `setTimeout(fn, 0)` in JS, but without the callback — it creates a lightweight thread (goroutine) that runs concurrently.

In the HTTP handler for `/trigger`, we fire off the scrape and immediately return a response — the scrape happens in the background.

### `go` in Start()

```go
func (c *Scheduler) Start() {
    go c.runNow()    // run immediately, don't block
    go c.runDaily()  // start the daily ticker loop in background
}
```

Without `go`, `runNow()` would block `Start()`, which would block `main()`, and the HTTP server would never start.

### `time.NewTicker`

```go
ticker := time.NewTicker(24 * time.Hour)
for range ticker.C {     // C is a channel that sends a value every 24h
    c.scrapeAll()
}
```

`ticker.C` is a channel — Go's way of communicating between goroutines. `for range ticker.C` blocks until the next tick arrives, then runs the body.

---

## HTTP Server (stdlib)

Go's standard library has a built-in HTTP server — no Express, no framework needed:

```go
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
})

log.Fatal(http.ListenAndServe(":8080", nil))
```

- `w http.ResponseWriter` — write the response to this
- `r *http.Request` — read the request from this
- `log.Fatal` — if the server dies, log the error and exit

### `defer` — runs at end of function

```go
resp, err := client.Get(url)
defer resp.Body.Close()   // will run when the surrounding function returns
```

`defer` is like a `finally` block — great for cleanup (close files, DB connections, response bodies).

---

## Module System — `go.mod`

```
module github.com/kingsleydaprime/btp/services/job-scraper
go 1.22
```

The module path is the prefix for all local imports. Third-party deps go in `go.sum` (auto-managed by `go get`/`go mod tidy`).

---

## Project Layout Conventions

```
cmd/
  server/
    main.go       ← entry point (can have multiple binaries under cmd/)
internal/
  scraper/
    scraper.go    ← scraper package (only this module can import it)
  cron/
    cron.go       ← scheduler package
```

`internal/` is a Go enforced boundary — packages inside `internal/` cannot be imported by code outside this module. Good for "not a public API".

---

## Things That Confused Me / To Remember

| Confusion | Explanation |
|-----------|------------|
| `*Scraper` vs `Scraper` | `*Scraper` is a pointer (refers to a Scraper), `Scraper` is a value (copy of the struct) |
| `&Scraper{...}` in `New()` | Creates a Scraper literal and returns its address — caller gets a pointer |
| `go` before function call | Runs it as a goroutine (concurrently), not synchronously |
| No `return err` at the end | Functions with multiple return types: `([]Job, error)` — you return both together |
| `defer` placement | Write it right after acquiring the resource — it runs last, when the function exits |
| `json:"snake_case"` tags | Go field names are PascalCase by convention; JSON is usually camelCase or snake_case — the tag bridges them |
| `log.Fatal` vs `log.Println` | `Fatal` logs then calls `os.Exit(1)` — program stops. `Println` just logs. |

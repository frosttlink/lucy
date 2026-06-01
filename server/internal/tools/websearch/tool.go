package websearch

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/frostz/lucy/internal/tools"
)

type Tool struct{}

func New() *Tool {
	return &Tool{}
}

func (t *Tool) Name() string {
	return "web_search"
}

func (t *Tool) Description() string {
	return "Search the internet for current information. Use this when you need to look up facts, news, or any information that might be beyond your knowledge cutoff."
}

func (t *Tool) Parameters() map[string]interface{} {
	return map[string]interface{}{
		"query": map[string]interface{}{
			"type":        "string",
			"description": "The search query",
		},
	}
}

func (t *Tool) Execute(ctx context.Context, params tools.Params) (string, error) {
	query, ok := params["query"].(string)
	if !ok || strings.TrimSpace(query) == "" {
		return "", fmt.Errorf("query is required")
	}

	results, err := searchDuckDuckGo(ctx, query)
	if err != nil {
		return "", fmt.Errorf("search failed: %w", err)
	}

	b, _ := json.MarshalIndent(results, "", "  ")
	return string(b), nil
}

type searchResult struct {
	Title   string `json:"title"`
	Snippet string `json:"snippet"`
	URL     string `json:"url"`
}

func searchDuckDuckGo(ctx context.Context, query string) ([]searchResult, error) {
	reqURL := fmt.Sprintf("https://html.duckduckgo.com/html/?q=%s", url.QueryEscape(query))
	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; LucyBot/1.0)")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Limit read size
	body, err := io.ReadAll(io.LimitReader(resp.Body, 1_000_000))
	if err != nil {
		return nil, err
	}

	doc, err := goquery.NewDocumentFromReader(strings.NewReader(string(body)))
	if err != nil {
		return nil, err
	}

	var results []searchResult
	doc.Find(".result").Each(func(i int, s *goquery.Selection) {
		if i >= 5 {
			return
		}
		title := strings.TrimSpace(s.Find(".result__title").Text())
		snippet := strings.TrimSpace(s.Find(".result__snippet").Text())
		link, _ := s.Find(".result__url").Attr("href")
		link = cleanURL(link)
		if title != "" {
			results = append(results, searchResult{Title: title, Snippet: snippet, URL: link})
		}
	})

	if len(results) == 0 {
		return nil, fmt.Errorf("no results found")
	}

	return results, nil
}

func cleanURL(raw string) string {
	// DuckDuckGo uses redirect URLs
	if strings.Contains(raw, "uddg=") {
		for _, part := range strings.Split(raw, "&") {
			if strings.HasPrefix(part, "uddg=") {
				if u, err := url.QueryUnescape(part[5:]); err == nil {
					return u
				}
			}
		}
	}
	return raw
}

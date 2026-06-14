package moderation

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type Result struct {
	Status      string    `json:"status"`
	Score       float64   `json:"score"`
	Reasons     []string  `json:"reasons"`
	Categories  []string  `json:"categories"`
	Provider    string    `json:"provider"`
	ModeratedAt time.Time `json:"moderated_at"`
}

type Service struct {
	provider    string
	ollamaURL   string
	ollamaModel string
	openaiKey   string
	openaiModel string
}

func NewService() *Service {
	return &Service{
		provider:    getEnv("AI_PROVIDER", "ollama"),
		ollamaURL:   getEnv("OLLAMA_BASE_URL", "http://localhost:11434"),
		ollamaModel: getEnv("OLLAMA_MODEL", "llama3.2"),
		openaiKey:   os.Getenv("OPENAI_API_KEY"),
		openaiModel: getEnv("OPENAI_MODEL", "gpt-4o-mini"),
	}
}

const moderationPrompt = `You are a content moderator for a technical developer forum. Analyze the following content.
Respond with ONLY a valid JSON object, no other text before or after.

Content type: %s
%sContent: %s

Required JSON format:
{"status": "approved", "score": 0.95, "reasons": [], "categories": []}

- status: "approved" (appropriate), "flagged" (potentially problematic, needs review), "rejected" (clearly violates rules)
- score: confidence from 0.0 to 1.0
- reasons: array of strings explaining the decision (empty if approved)
- categories: violation types from: hate_speech, harassment, spam, explicit_content, illegal_content, misinformation (empty if approved)

Reject content with: hate speech, explicit sexual content, illegal activities, severe harassment.
Flag content with: mild insults, unverified claims, potential spam, borderline language.
Approve everything else including technical discussions, questions, opinions, and debates.`

func (s *Service) Classify(contentType, title, body string) (*Result, error) {
	titleLine := ""
	if title != "" {
		titleLine = fmt.Sprintf("Title: %s\n", title)
	}
	prompt := fmt.Sprintf(moderationPrompt, contentType, titleLine, body)

	var raw string
	var err error
	switch s.provider {
	case "openai":
		raw, err = s.callOpenAI(prompt)
	default:
		raw, err = s.callOllama(prompt)
	}
	if err != nil {
		return nil, err
	}

	result, err := parseResult(raw)
	if err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}
	result.Provider = s.provider
	result.ModeratedAt = time.Now()
	return result, nil
}

func (s *Service) callOllama(prompt string) (string, error) {
	payload, _ := json.Marshal(map[string]interface{}{
		"model":  s.ollamaModel,
		"prompt": prompt,
		"stream": false,
		"options": map[string]interface{}{
			"temperature": 0,
		},
	})
	resp, err := http.Post(s.ollamaURL+"/api/generate", "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return "", fmt.Errorf("ollama request failed: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("ollama response decode failed: %w", err)
	}
	response, ok := result["response"].(string)
	if !ok {
		return "", errors.New("invalid ollama response format")
	}
	return response, nil
}

func (s *Service) callOpenAI(prompt string) (string, error) {
	payload, _ := json.Marshal(map[string]interface{}{
		"model": s.openaiModel,
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"temperature": 0,
	})
	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.openaiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("openai request failed: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("openai response decode failed: %w", err)
	}
	choices, ok := result["choices"].([]interface{})
	if !ok || len(choices) == 0 {
		return "", errors.New("invalid openai response: no choices")
	}
	choice, ok := choices[0].(map[string]interface{})
	if !ok {
		return "", errors.New("invalid openai choice format")
	}
	message, ok := choice["message"].(map[string]interface{})
	if !ok {
		return "", errors.New("invalid openai message format")
	}
	content, ok := message["content"].(string)
	if !ok {
		return "", errors.New("invalid openai content format")
	}
	return content, nil
}

func parseResult(raw string) (*Result, error) {
	jsonStr := extractJSON(raw)
	if jsonStr == "" {
		return nil, errors.New("no JSON found in response")
	}
	var result Result
	if err := json.Unmarshal([]byte(jsonStr), &result); err != nil {
		return nil, fmt.Errorf("JSON unmarshal failed: %w", err)
	}
	switch result.Status {
	case "approved", "flagged", "rejected":
	default:
		result.Status = "approved"
	}
	if result.Score < 0 || result.Score > 1 {
		result.Score = 0.5
	}
	if result.Reasons == nil {
		result.Reasons = []string{}
	}
	if result.Categories == nil {
		result.Categories = []string{}
	}
	return &result, nil
}

func extractJSON(s string) string {
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start == -1 || end == -1 || end <= start {
		return ""
	}
	return s[start : end+1]
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

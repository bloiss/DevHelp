package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
)

type AIService struct {
	ollamaURL string
	model     string
}

func NewAIService(ollamaURL, model string) *AIService {
	return &AIService{ollamaURL: ollamaURL, model: model}
}

func (s *AIService) Improve(text string) (string, error) {
	prompt := "Améliore ce texte en français. Retourne UNIQUEMENT le texte amélioré, sans explication ni option : " + text


	body, _ := json.Marshal(map[string]interface{}{
		"model":  s.model,
		"prompt": prompt,
		"stream": false,
	})

	resp, err := http.Post(s.ollamaURL+"/api/generate", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	response, ok := result["response"].(string)
	if !ok {
		return "", errors.New("invalid response from ollama")
	}
	return response, nil
}

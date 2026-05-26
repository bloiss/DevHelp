package service

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
)

var ErrCaptchaInvalid = errors.New("captcha validation failed")

type CaptchaService struct {
	secret string
}

func NewCaptchaService(secret string) *CaptchaService {
	return &CaptchaService{secret: secret}
}

type hCaptchaResponse struct {
	Success bool     `json:"success"`
	Errors  []string `json:"error-codes"`
}

// Verify valide le token hCaptcha envoyé par le frontend.
// En mode dev (secret vide ou token bypass-dev), la validation est ignorée.
func (s *CaptchaService) Verify(token string) error {
	if s.secret == "" || token == "bypass-dev" {
		return nil
	}
	resp, err := http.PostForm("https://api.hcaptcha.com/siteverify", url.Values{
		"secret":   {s.secret},
		"response": {token},
	})
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result hCaptchaResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return err
	}

	if !result.Success {
		return ErrCaptchaInvalid
	}
	return nil
}

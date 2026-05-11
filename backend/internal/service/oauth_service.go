package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

type OAuthService struct {
	userRepo     *repository.UserRepository
	authService  *AuthService
	googleConfig *oauth2.Config
	githubConfig *oauth2.Config
}

func NewOAuthService(
	userRepo *repository.UserRepository,
	authService *AuthService,
	googleClientID, googleClientSecret, googleRedirectURL string,
	githubClientID, githubClientSecret, githubRedirectURL string,
) *OAuthService {
	return &OAuthService{
		userRepo:    userRepo,
		authService: authService,
		googleConfig: &oauth2.Config{
			ClientID:     googleClientID,
			ClientSecret: googleClientSecret,
			RedirectURL:  googleRedirectURL,
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		},
		githubConfig: &oauth2.Config{
			ClientID:     githubClientID,
			ClientSecret: githubClientSecret,
			RedirectURL:  githubRedirectURL,
			Scopes:       []string{"user:email"},
			Endpoint:     github.Endpoint,
		},
	}
}

func (s *OAuthService) GetGoogleAuthURL(state string) string {
	return s.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOnline)
}

func (s *OAuthService) GetGitHubAuthURL(state string) string {
	return s.githubConfig.AuthCodeURL(state, oauth2.AccessTypeOnline)
}

// ─── Google Callback ──────────────────────────────────────────────

type googleUserInfo struct {
	Sub     string `json:"sub"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func (s *OAuthService) HandleGoogleCallback(code string) (*model.User, string, string, error) {
	token, err := s.googleConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, "", "", ErrInvalidToken
	}

	resp, err := http.Get("https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		return nil, "", "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var info googleUserInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, "", "", err
	}

	username := sanitizeUsername(info.Name)
	return s.findOrCreateOAuthUser("google", info.Sub, info.Email, username, info.Picture)
}

// ─── GitHub Callback ──────────────────────────────────────────────

type githubUserInfo struct {
	ID        int    `json:"id"`
	Login     string `json:"login"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
}

func (s *OAuthService) HandleGitHubCallback(code string) (*model.User, string, string, error) {
	token, err := s.githubConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, "", "", ErrInvalidToken
	}

	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, "", "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var info githubUserInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, "", "", err
	}

	// Certains comptes GitHub cachent leur email → fallback sur /user/emails
	if info.Email == "" {
		info.Email, _ = s.getGitHubPrimaryEmail(token.AccessToken)
	}
	// Dernier recours si toujours vide
	if info.Email == "" {
		info.Email = fmt.Sprintf("github-%d@noreply.github.com", info.ID)
	}

	providerID := fmt.Sprintf("%d", info.ID)
	return s.findOrCreateOAuthUser("github", providerID, info.Email, info.Login, info.AvatarURL)
}

func (s *OAuthService) getGitHubPrimaryEmail(accessToken string) (string, error) {
	req, _ := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var emails []struct {
		Email   string `json:"email"`
		Primary bool   `json:"primary"`
	}
	body, _ := io.ReadAll(resp.Body)
	_ = json.Unmarshal(body, &emails)

	for _, e := range emails {
		if e.Primary {
			return e.Email, nil
		}
	}
	return "", nil
}

// ─── Find or Create (fusion logic) ───────────────────────────────

func (s *OAuthService) findOrCreateOAuthUser(provider, providerID, email, username, avatarURL string) (*model.User, string, string, error) {
	// 1. Provider déjà connu → login direct
	existing, err := s.userRepo.FindOAuthProvider(provider, providerID)
	if err == nil {
		user, err := s.userRepo.FindByID(existing.UserID)
		if err != nil {
			return nil, "", "", ErrAccountNotFound
		}
		access, refresh, err := s.authService.generateTokenPair(user)
		return user, access, refresh, err
	}

	// 2. Email déjà existant → fusion (on lie le provider OAuth au compte existant)
	var user *model.User
	existingUser, err := s.userRepo.FindByEmail(email)
	if err == nil {
		user = existingUser
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		// 3. Nouveau compte
		uniqueUsername := s.uniqueUsername(username)
		avatarPtr := &avatarURL
		newUser := &model.User{
			Email:     email,
			Username:  uniqueUsername,
			AvatarURL: avatarPtr,
			Role:      model.RoleUser,
		}
		if err := s.userRepo.Create(newUser); err != nil {
			return nil, "", "", err
		}
		user = newUser
	} else {
		return nil, "", "", err
	}

	// Créer le lien OAuthProvider
	op := &model.OAuthProvider{
		UserID:     user.ID,
		Provider:   provider,
		ProviderID: providerID,
	}
	_ = s.userRepo.CreateOAuthProvider(op)

	access, refresh, err := s.authService.generateTokenPair(user)
	return user, access, refresh, err
}

// ─── Helpers ──────────────────────────────────────────────────────

func sanitizeUsername(name string) string {
	lower := strings.ToLower(name)
	var b strings.Builder
	for _, r := range lower {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '_' {
			b.WriteRune(r)
		}
	}
	s := b.String()
	if len(s) < 3 {
		s += "user"
	}
	if len(s) > 30 {
		s = s[:30]
	}
	return s
}

func (s *OAuthService) uniqueUsername(base string) string {
	base = sanitizeUsername(base)
	username := base
	for i := 1; i <= 100; i++ {
		if _, err := s.userRepo.FindByUsername(username); err != nil {
			return username
		}
		username = fmt.Sprintf("%s%d", base, i)
	}
	// Fallback avec token aléatoire
	suffix, _ := generateSecureToken(4)
	return sanitizeUsername(base[:min(20, len(base))] + suffix)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

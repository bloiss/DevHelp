package handler

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
)

// ─── State store en mémoire (remplace les cookies pour le state OAuth) ────────
// Plus fiable que les cookies sur des redirections cross-domain en local.

type oauthStateStore struct {
	mu     sync.Mutex
	states map[string]time.Time // state → expiry
}

var stateStore = &oauthStateStore{
	states: make(map[string]time.Time),
}

func (s *oauthStateStore) add(state string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.states[state] = time.Now().Add(5 * time.Minute)
}

func (s *oauthStateStore) consume(state string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	expiry, ok := s.states[state]
	if !ok || time.Now().After(expiry) {
		delete(s.states, state)
		return false
	}
	delete(s.states, state)
	return true
}

// ─── Handler ──────────────────────────────────────────────────────────────────

type OAuthHandler struct {
	oauthService *service.OAuthService
}

func NewOAuthHandler(oauthService *service.OAuthService) *OAuthHandler {
	return &OAuthHandler{oauthService: oauthService}
}

// ─── Google ───────────────────────────────────────────────────────────────────

func (h *OAuthHandler) GoogleLogin(c *gin.Context) {
	state := generateOAuthState()
	stateStore.add(state)
	c.Redirect(http.StatusTemporaryRedirect, h.oauthService.GetGoogleAuthURL(state))
}

func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:5173"
	}

	if !stateStore.consume(c.Query("state")) {
		c.Redirect(http.StatusTemporaryRedirect, appURL+"/auth/login?error=oauth_failed")
		return
	}

	user, access, refresh, err := h.oauthService.HandleGoogleCallback(c.Query("code"))
	if err != nil {
		log.Printf("[OAuth] Google callback error: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, appURL+"/auth/login?error=oauth_failed")
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf(
		"%s/auth/callback?access_token=%s&refresh_token=%s&username=%s",
		appURL, access, refresh, user.Username,
	))
}

// ─── GitHub ───────────────────────────────────────────────────────────────────

func (h *OAuthHandler) GitHubLogin(c *gin.Context) {
	state := generateOAuthState()
	stateStore.add(state)
	c.Redirect(http.StatusTemporaryRedirect, h.oauthService.GetGitHubAuthURL(state))
}

func (h *OAuthHandler) GitHubCallback(c *gin.Context) {
	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:5173"
	}

	if !stateStore.consume(c.Query("state")) {
		c.Redirect(http.StatusTemporaryRedirect, appURL+"/auth/login?error=oauth_failed")
		return
	}

	user, access, refresh, err := h.oauthService.HandleGitHubCallback(c.Query("code"))
	if err != nil {
		log.Printf("[OAuth] GitHub callback error: %v", err)
		c.Redirect(http.StatusTemporaryRedirect, appURL+"/auth/login?error=oauth_failed")
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, fmt.Sprintf(
		"%s/auth/callback?access_token=%s&refresh_token=%s&username=%s",
		appURL, access, refresh, user.Username,
	))
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

func generateOAuthState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

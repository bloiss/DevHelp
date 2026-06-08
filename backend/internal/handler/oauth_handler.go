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

// GoogleLogin godoc
// @Summary      Redirection vers Google OAuth
// @Description  Génère un state CSRF et redirige l'utilisateur vers la page d'authentification Google.
// @Tags         auth
// @Produce      json
// @Success      307 {string} string "Redirect to Google"
// @Router       /api/v1/auth/google [get]
func (h *OAuthHandler) GoogleLogin(c *gin.Context) {
	state := generateOAuthState()
	stateStore.add(state)
	c.Redirect(http.StatusTemporaryRedirect, h.oauthService.GetGoogleAuthURL(state))
}

// GoogleCallback godoc
// @Summary      Callback Google OAuth
// @Description  Reçoit le code d'autorisation Google, échange les tokens, crée ou connecte l'utilisateur et redirige vers le frontend avec les tokens JWT.
// @Tags         auth
// @Produce      json
// @Param        state query string true "State CSRF"
// @Param        code  query string true "Code d'autorisation"
// @Success      307 {string} string "Redirect to frontend with tokens"
// @Failure      307 {string} string "Redirect to /auth/login?error=oauth_failed"
// @Router       /api/v1/auth/google/callback [get]
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

// GitHubLogin godoc
// @Summary      Redirection vers GitHub OAuth
// @Description  Génère un state CSRF et redirige l'utilisateur vers la page d'authentification GitHub.
// @Tags         auth
// @Produce      json
// @Success      307 {string} string "Redirect to GitHub"
// @Router       /api/v1/auth/github [get]
func (h *OAuthHandler) GitHubLogin(c *gin.Context) {
	state := generateOAuthState()
	stateStore.add(state)
	c.Redirect(http.StatusTemporaryRedirect, h.oauthService.GetGitHubAuthURL(state))
}

// GitHubCallback godoc
// @Summary      Callback GitHub OAuth
// @Description  Reçoit le code d'autorisation GitHub, échange les tokens, crée ou connecte l'utilisateur et redirige vers le frontend avec les tokens JWT.
// @Tags         auth
// @Produce      json
// @Param        state query string true "State CSRF"
// @Param        code  query string true "Code d'autorisation"
// @Success      307 {string} string "Redirect to frontend with tokens"
// @Failure      307 {string} string "Redirect to /auth/login?error=oauth_failed"
// @Router       /api/v1/auth/github/callback [get]
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

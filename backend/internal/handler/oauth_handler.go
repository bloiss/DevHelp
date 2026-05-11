package handler

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type OAuthHandler struct {
	oauthService *service.OAuthService
}

func NewOAuthHandler(oauthService *service.OAuthService) *OAuthHandler {
	return &OAuthHandler{oauthService: oauthService}
}

const oauthStateCookie = "oauth_state"

// ─── Google ───────────────────────────────────────────────────────

// GoogleLogin godoc
// @Summary      Initier la connexion via Google OAuth
// @Tags         auth
// @Success      302
// @Router       /auth/google [get]
func (h *OAuthHandler) GoogleLogin(c *gin.Context) {
	state := generateOAuthState()
	c.SetCookie(oauthStateCookie, state, 300, "/", "", false, true)
	c.Redirect(http.StatusTemporaryRedirect, h.oauthService.GetGoogleAuthURL(state))
}

// GoogleCallback godoc
// @Summary      Callback Google OAuth
// @Tags         auth
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /auth/google/callback [get]
func (h *OAuthHandler) GoogleCallback(c *gin.Context) {
	if !h.validateState(c) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid oauth state"})
		return
	}

	user, access, refresh, err := h.oauthService.HandleGoogleCallback(c.Query("code"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "google oauth failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":          user,
		"access_token":  access,
		"refresh_token": refresh,
	})
}

// ─── GitHub ───────────────────────────────────────────────────────

// GitHubLogin godoc
// @Summary      Initier la connexion via GitHub OAuth
// @Tags         auth
// @Success      302
// @Router       /auth/github [get]
func (h *OAuthHandler) GitHubLogin(c *gin.Context) {
	state := generateOAuthState()
	c.SetCookie(oauthStateCookie, state, 300, "/", "", false, true)
	c.Redirect(http.StatusTemporaryRedirect, h.oauthService.GetGitHubAuthURL(state))
}

// GitHubCallback godoc
// @Summary      Callback GitHub OAuth
// @Tags         auth
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /auth/github/callback [get]
func (h *OAuthHandler) GitHubCallback(c *gin.Context) {
	if !h.validateState(c) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid oauth state"})
		return
	}

	user, access, refresh, err := h.oauthService.HandleGitHubCallback(c.Query("code"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "github oauth failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":          user,
		"access_token":  access,
		"refresh_token": refresh,
	})
}

// ─── Helpers ──────────────────────────────────────────────────────

func (h *OAuthHandler) validateState(c *gin.Context) bool {
	cookie, err := c.Cookie(oauthStateCookie)
	if err != nil || cookie != c.Query("state") {
		return false
	}
	c.SetCookie(oauthStateCookie, "", -1, "/", "", false, true)
	return true
}

func generateOAuthState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

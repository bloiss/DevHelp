package handler

import (
	"net/http"

	"github.com/bloiss/devhelp/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authService    *service.AuthService
	emailService   *service.EmailService
	captchaService *service.CaptchaService
}

func NewAuthHandler(authService *service.AuthService, emailService *service.EmailService, captchaService *service.CaptchaService) *AuthHandler {
	return &AuthHandler{authService: authService, emailService: emailService, captchaService: captchaService}
}

// ─── Register ─────────────────────────────────────────────────────

type registerRequest struct {
	Email          string `json:"email"           binding:"required,email"`
	Username       string `json:"username"        binding:"required,min=3,max=30"`
	Password       string `json:"password"        binding:"required,min=8"`
	CaptchaToken   string `json:"captcha_token"   binding:"required"`
}

// Register godoc
// @Summary      Inscription par email/mot de passe
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body registerRequest true "Données d'inscription"
// @Success      201 {object} map[string]interface{}
// @Failure      400 {object} map[string]string
// @Failure      409 {object} map[string]string
// @Router       /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.captchaService.Verify(req.CaptchaToken); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "captcha validation failed"})
		return
	}

	user, access, refresh, err := h.authService.Register(service.RegisterInput{
		Email:    req.Email,
		Username: req.Username,
		Password: req.Password,
	})
	if err != nil {
		switch err {
		case service.ErrEmailAlreadyExists, service.ErrUsernameAlreadyExists:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "registration failed"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"user":          user,
		"access_token":  access,
		"refresh_token": refresh,
	})
}

// ─── Login ────────────────────────────────────────────────────────

type loginRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Login godoc
// @Summary      Connexion par email/mot de passe
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body loginRequest true "Identifiants"
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, access, refresh, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":          user,
		"access_token":  access,
		"refresh_token": refresh,
	})
}

// ─── Refresh ──────────────────────────────────────────────────────

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Refresh godoc
// @Summary      Renouveler les tokens
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body refreshRequest true "Refresh token"
// @Success      200 {object} map[string]interface{}
// @Failure      401 {object} map[string]string
// @Router       /auth/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, access, refresh, err := h.authService.RefreshTokens(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired refresh token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user":          user,
		"access_token":  access,
		"refresh_token": refresh,
	})
}

// ─── Forgot Password ──────────────────────────────────────────────

type forgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ForgotPassword godoc
// @Summary      Demande de réinitialisation de mot de passe
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body forgotPasswordRequest true "Email"
// @Success      200 {object} map[string]string
// @Router       /auth/forgot-password [post]
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req forgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rawToken, err := h.authService.ForgotPassword(req.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to process request"})
		return
	}

	// Envoyer l'email uniquement si un token a été généré (email existant)
	if rawToken != "" {
		_ = h.emailService.SendPasswordReset(req.Email, rawToken)
	}

	// Toujours répondre 200 pour ne pas révéler si l'email existe
	c.JSON(http.StatusOK, gin.H{"message": "if this email exists, a reset link has been sent"})
}

// ─── Reset Password ───────────────────────────────────────────────

type resetPasswordRequest struct {
	Token       string `json:"token"        binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// ResetPassword godoc
// @Summary      Réinitialisation du mot de passe
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        body body resetPasswordRequest true "Token + nouveau mot de passe"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Router       /auth/reset-password [post]
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req resetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.ResetPassword(req.Token, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password reset successfully"})
}

// ─── Logout ───────────────────────────────────────────────────────

type logoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// Logout godoc
// @Summary      Déconnexion (révocation du refresh token)
// @Tags         auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {object} map[string]string
// @Router       /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	var req logoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = h.authService.Logout(req.RefreshToken)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// ─── Set Password (post-OAuth) ────────────────────────────────────

type setPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// SetPassword godoc
// @Summary      Définir un mot de passe après inscription OAuth
// @Tags         auth
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body setPasswordRequest true "Nouveau mot de passe"
// @Success      200 {object} map[string]string
// @Failure      400 {object} map[string]string
// @Router       /auth/set-password [post]
func (h *AuthHandler) SetPassword(c *gin.Context) {
	var req setPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.MustGet("user_id").(uuid.UUID)
	if err := h.authService.SetPassword(userID, req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password set successfully"})
}

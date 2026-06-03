package service

import (
	"fmt"

	"github.com/resend/resend-go/v2"
)

type EmailService struct {
	client *resend.Client
	from   string
	appURL string
}

func NewEmailService(apiKey, from, appURL string) *EmailService {
	return &EmailService{
		client: resend.NewClient(apiKey),
		from:   from,
		appURL: appURL,
	}
}

// SendPasswordReset envoie le lien de réinitialisation de mot de passe.
func (s *EmailService) SendPasswordReset(toEmail, rawToken string) error {
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", s.appURL, rawToken)

	params := &resend.SendEmailRequest{
		From:    s.from,
		To:      []string{toEmail},
		Subject: "Réinitialisation de votre mot de passe — DevHelp",
		Html: fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 40px;">
  <div style="max-width: 500px; margin: 0 auto;">
    <h2 style="color: #7c6ff7;">DevHelp</h2>
    <p>Tu as demandé à réinitialiser ton mot de passe.</p>
    <p>Clique sur le bouton ci-dessous — ce lien est valable <strong>1 heure</strong>.</p>
    <a href="%s"
       style="display:inline-block;margin:20px 0;padding:12px 24px;
              background:#7c6ff7;color:#fff;text-decoration:none;
              border-radius:6px;font-weight:bold;">
      Réinitialiser mon mot de passe
    </a>
    <p style="color:#888;font-size:12px;">
      Si tu n'es pas à l'origine de cette demande, ignore cet email.
    </p>
  </div>
</body>
</html>`, resetLink),
	}

	_, err := s.client.Emails.Send(params)
	return err
}

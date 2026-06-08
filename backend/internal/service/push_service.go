package service

import (
	"encoding/json"
	"log"

	webpush "github.com/SherClockHolmes/webpush-go"
	"github.com/bloiss/devhelp/backend/internal/model"
	"github.com/bloiss/devhelp/backend/internal/repository"
	"github.com/google/uuid"
)

type PushService struct {
	repo           *repository.PushRepository
	vapidPublicKey  string
	vapidPrivateKey string
	vapidSubject    string
}

func NewPushService(repo *repository.PushRepository, publicKey, privateKey, subject string) *PushService {
	return &PushService{
		repo:            repo,
		vapidPublicKey:  publicKey,
		vapidPrivateKey: privateKey,
		vapidSubject:    subject,
	}
}

// SendToUser envoie une push notification à tous les abonnements d'un utilisateur.
func (s *PushService) SendToUser(userID uuid.UUID, title, body, url string) {
	if s.vapidPublicKey == "" || s.vapidPrivateKey == "" {
		return // VAPID non configuré
	}

	subs := s.repo.FindByUser(userID)
	if len(subs) == 0 {
		return
	}

	payload, err := json.Marshal(map[string]string{
		"title": title,
		"body":  body,
		"url":   url,
	})
	if err != nil {
		return
	}

	for _, sub := range subs {
		s.sendOne(sub, payload)
	}
}

func (s *PushService) sendOne(sub model.PushSubscription, payload []byte) {
	wsSub := &webpush.Subscription{
		Endpoint: sub.Endpoint,
		Keys: webpush.Keys{
			P256dh: sub.P256dhKey,
			Auth:   sub.AuthKey,
		},
	}

	resp, err := webpush.SendNotification(payload, wsSub, &webpush.Options{
		VAPIDPublicKey:  s.vapidPublicKey,
		VAPIDPrivateKey: s.vapidPrivateKey,
		Subscriber:      s.vapidSubject,
		TTL:             60,
	})
	if err != nil {
		log.Printf("push send error for endpoint %s: %v", sub.Endpoint, err)
		return
	}
	resp.Body.Close()
}

// SaveSubscription enregistre un abonnement push.
func (s *PushService) SaveSubscription(userID uuid.UUID, endpoint, p256dh, auth string) error {
	sub := &model.PushSubscription{
		UserID:    userID,
		Endpoint:  endpoint,
		P256dhKey: p256dh,
		AuthKey:   auth,
	}
	return s.repo.Save(sub)
}

// DeleteSubscription supprime un abonnement push.
func (s *PushService) DeleteSubscription(userID uuid.UUID, endpoint string) error {
	return s.repo.DeleteByEndpoint(userID, endpoint)
}

// GetPrefs retourne les préférences de notifications d'un utilisateur.
func (s *PushService) GetPrefs(userID uuid.UUID) *model.NotificationPrefs {
	return s.repo.GetPrefs(userID)
}

// UpdatePrefs met à jour les préférences de notifications.
func (s *PushService) UpdatePrefs(prefs *model.NotificationPrefs) error {
	return s.repo.UpsertPrefs(prefs)
}

// VAPIDPublicKey expose la clé publique VAPID pour le frontend.
func (s *PushService) VAPIDPublicKey() string {
	return s.vapidPublicKey
}

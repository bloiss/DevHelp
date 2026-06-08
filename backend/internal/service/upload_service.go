package service

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"net/url"
	"path"

	"github.com/bloiss/devhelp/backend/internal/config"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var (
	ErrFileTooLarge    = errors.New("file exceeds 20 MB limit")
	ErrInvalidMimeType = errors.New("unsupported file type: only PNG, JPEG and GIF are allowed")
)

const maxUploadSize = 20 << 20 // 20 MB

var allowedMimeTypes = map[string]string{
	"image/png":  ".png",
	"image/jpeg": ".jpg",
	"image/gif":  ".gif",
}

type UploadService struct {
	client   *minio.Client
	bucket   string
	endpoint string
	useSSL   bool
}

func NewUploadService(cfg *config.Config) (*UploadService, error) {
	endpoint := cfg.S3Endpoint
	// strip scheme — minio-go expects host:port
	if u, err := url.Parse(endpoint); err == nil && u.Host != "" {
		endpoint = u.Host
	}

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.S3AccessKey, cfg.S3SecretKey, ""),
		Secure: cfg.S3UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio init: %w", err)
	}

	svc := &UploadService{
		client:   client,
		bucket:   cfg.S3Bucket,
		endpoint: cfg.S3Endpoint,
		useSSL:   cfg.S3UseSSL,
	}

	if err := svc.ensureBucket(context.Background()); err != nil {
		return nil, fmt.Errorf("minio bucket: %w", err)
	}

	return svc, nil
}

func (s *UploadService) ensureBucket(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	if err := s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{}); err != nil {
		return err
	}
	// rendre le bucket public en lecture
	policy := fmt.Sprintf(`{
		"Version":"2012-10-17",
		"Statement":[{
			"Effect":"Allow",
			"Principal":{"AWS":["*"]},
			"Action":["s3:GetObject"],
			"Resource":["arn:aws:s3:::%s/*"]
		}]
	}`, s.bucket)
	return s.client.SetBucketPolicy(ctx, s.bucket, policy)
}

type UploadResult struct {
	URL  string `json:"url"`
	Name string `json:"name"`
}

func (s *UploadService) UploadImage(ctx context.Context, fh *multipart.FileHeader) (*UploadResult, error) {
	if fh.Size > maxUploadSize {
		return nil, ErrFileTooLarge
	}

	mimeType := fh.Header.Get("Content-Type")
	ext, ok := allowedMimeTypes[mimeType]
	if !ok {
		return nil, ErrInvalidMimeType
	}

	f, err := fh.Open()
	if err != nil {
		return nil, fmt.Errorf("open file: %w", err)
	}
	defer f.Close()

	objectName := path.Join("images", uuid.New().String()+ext)

	_, err = s.client.PutObject(ctx, s.bucket, objectName, f, fh.Size, minio.PutObjectOptions{
		ContentType: mimeType,
	})
	if err != nil {
		return nil, fmt.Errorf("minio put: %w", err)
	}

	publicURL := fmt.Sprintf("%s/%s/%s", s.endpoint, s.bucket, objectName)
	return &UploadResult{URL: publicURL, Name: objectName}, nil
}

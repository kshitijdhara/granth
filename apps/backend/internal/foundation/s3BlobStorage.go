package foundation

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// S3Client is the package-level client, set by InitS3Client.
var S3Client *s3.Client

// s3Bucket is set once at init time and used by all helpers.
var s3Bucket string

// S3Config holds the values needed to initialise the client.
// In local dev (Env == "local") the client points at a SeaweedFS endpoint.
// In production it uses the standard AWS credential chain (IAM role / env vars).
type S3Config struct {
	Env             string // "local" → SeaweedFS; anything else → AWS S3
	Endpoint        string // SeaweedFS S3 endpoint, e.g. "http://localhost:8333"
	Region          string
	AccessKeyID     string
	SecretAccessKey string
	Bucket          string
}

// InitS3Client creates and validates an S3 client from cfg.
// It sets the package-level S3Client and returns it, matching the pattern
// used by InitPostgresDB / InitRedisClient in database.go.
func InitS3Client(cfg S3Config) (*s3.Client, error) {
	s3Bucket = cfg.Bucket

	var (
		awsCfg aws.Config
		err    error
	)

	if cfg.Env == "local" {
		// SeaweedFS: static credentials + custom endpoint + path-style addressing.
		awsCfg, err = config.LoadDefaultConfig(
			context.Background(),
			config.WithRegion(cfg.Region),
			config.WithCredentialsProvider(
				credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, ""),
			),
		)
		if err != nil {
			return nil, fmt.Errorf("Loading local s3 config (seaweedfs): %w", err)
		}
		S3Client = s3.NewFromConfig(awsCfg, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
			o.UsePathStyle = true // required by SeaweedFS
		})
	} else {
		// Production: standard AWS credential chain (IAM role, env vars, ~/.aws).
		awsCfg, err = config.LoadDefaultConfig(
			context.Background(),
			config.WithRegion(cfg.Region),
		)
		if err != nil {
			return nil, fmt.Errorf("Loading production config: %w", err)
		}
		S3Client = s3.NewFromConfig(awsCfg)
	}

	return S3Client, nil
}

// UploadObject stores body under key in the configured bucket.
func UploadObject(ctx context.Context, key, contentType string, body io.Reader) error {
	_, err := S3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s3Bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return fmt.Errorf("Upload %q: %w", key, err)
	}
	return nil
}

// DownloadObject fetches key from the configured bucket.
// The caller is responsible for closing the returned ReadCloser.
func DownloadObject(ctx context.Context, key string) (io.ReadCloser, int64, error) {
	out, err := S3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s3Bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("Download %q: %w", key, err)
	}
	size := int64(0)
	if out.ContentLength != nil {
		size = *out.ContentLength
	}
	return out.Body, size, nil
}

// DeleteObject removes key from the configured bucket.
func DeleteObject(ctx context.Context, key string) error {
	_, err := S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s3Bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("Delete %q: %w", key, err)
	}
	return nil
}

// GetPresignedURL returns a time-limited pre-signed GET URL for key.
func GetPresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	presign := s3.NewPresignClient(S3Client)
	req, err := presign.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s3Bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expiry))
	if err != nil {
		return "", fmt.Errorf("GetPresignedURL %q: %w", key, err)
	}
	return req.URL, nil
}

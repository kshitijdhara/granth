package notifications

import (
	"context"
	"database/sql"
	"fmt"

	"granth/internal/config"
)

// InsertNotification inserts a new notification row.
func InsertNotification(n *Notification, ctx context.Context) error {
	return config.PostgresDB.QueryRowContext(ctx,
		`INSERT INTO notifications (user_id, kind, payload)
		 VALUES ($1, $2, $3)
		 RETURNING id, created_at`,
		n.UserID, n.Kind, n.Payload,
	).Scan(&n.ID, &n.CreatedAt)
}

// FetchForUser returns up to 50 notifications for a user — unread first, then by recency.
func FetchForUser(userID string, ctx context.Context) ([]*Notification, error) {
	rows, err := config.PostgresDB.QueryContext(ctx,
		`SELECT id, user_id, kind, payload, read, created_at
		 FROM notifications
		 WHERE user_id = $1
		 ORDER BY read ASC, created_at DESC
		 LIMIT 50`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("error querying notifications: %w", err)
	}
	defer rows.Close()

	var out []*Notification
	for rows.Next() {
		n := &Notification{}
		if err := rows.Scan(&n.ID, &n.UserID, &n.Kind, &n.Payload, &n.Read, &n.CreatedAt); err != nil {
			return nil, fmt.Errorf("error scanning notification: %w", err)
		}
		out = append(out, n)
	}
	return out, nil
}

// MarkRead marks a single notification as read, scoped to the owning user.
func MarkRead(id, userID string, ctx context.Context) error {
	res, err := config.PostgresDB.ExecContext(ctx,
		`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
		id, userID,
	)
	if err != nil {
		return fmt.Errorf("error marking notification read: %w", err)
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// MarkAllRead marks all unread notifications for a user as read.
func MarkAllRead(userID string, ctx context.Context) error {
	_, err := config.PostgresDB.ExecContext(ctx,
		`UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
		userID,
	)
	if err != nil {
		return fmt.Errorf("error marking all notifications read: %w", err)
	}
	return nil
}

// CountUnread returns the number of unread notifications for a user.
func CountUnread(userID string, ctx context.Context) (int, error) {
	var count int
	err := config.PostgresDB.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false`,
		userID,
	).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("error counting unread notifications: %w", err)
	}
	return count, nil
}

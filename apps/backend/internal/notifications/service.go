package notifications

import (
	"context"
	"encoding/json"
	"log"

	"granth/internal/foundation"
)

// Emit fires a best-effort notification for a single recipient in a goroutine.
// It never blocks or fails the caller — notification delivery failure is logged only.
func Emit(kind, recipientID string, payload interface{}) {
	p, err := json.Marshal(payload)
	if err != nil {
		log.Printf("notifications.Emit: marshal error: %v", err)
		return
	}
	go func() {
		n := &Notification{UserID: recipientID, Kind: kind, Payload: p}
		if err := InsertNotification(n, context.Background()); err != nil {
			log.Printf("notifications.Emit: insert error (kind=%s recipient=%s): %v", kind, recipientID, err)
		}
	}()
}

// EmitToMany fires Emit for each recipient.
func EmitToMany(kind string, recipientIDs []string, payload interface{}) {
	if len(recipientIDs) == 0 {
		return
	}
	p, err := json.Marshal(payload)
	if err != nil {
		log.Printf("notifications.EmitToMany: marshal error: %v", err)
		return
	}
	for _, id := range recipientIDs {
		id := id // capture
		go func() {
			n := &Notification{UserID: id, Kind: kind, Payload: p}
			if err := InsertNotification(n, context.Background()); err != nil {
				log.Printf("notifications.EmitToMany: insert error (kind=%s recipient=%s): %v", kind, id, err)
			}
		}()
	}
}

// ── Route-level service functions ─────────────────────────────────────────────

func listNotifications(ctx context.Context) ([]*Notification, error) {
	userID, ok := foundation.GetUserIDFromContext(ctx)
	if !ok {
		return nil, context.Canceled
	}
	ns, err := FetchForUser(userID, ctx)
	if err != nil {
		return nil, err
	}
	if ns == nil {
		ns = []*Notification{}
	}
	return ns, nil
}

func markNotificationRead(id string, ctx context.Context) error {
	userID, ok := foundation.GetUserIDFromContext(ctx)
	if !ok {
		return context.Canceled
	}
	return MarkRead(id, userID, ctx)
}

func markAllNotificationsRead(ctx context.Context) error {
	userID, ok := foundation.GetUserIDFromContext(ctx)
	if !ok {
		return context.Canceled
	}
	return MarkAllRead(userID, ctx)
}

func countUnreadNotifications(ctx context.Context) (int, error) {
	userID, ok := foundation.GetUserIDFromContext(ctx)
	if !ok {
		return 0, context.Canceled
	}
	return CountUnread(userID, ctx)
}

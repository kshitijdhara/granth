package notifications

import (
	"net/http"

	"granth/internal/shared"

	"github.com/go-chi/chi/v5"
)

// NotificationsRouter builds and returns the notifications routes.
func NotificationsRouter() http.Handler {
	r := chi.NewRouter()

	r.Get("/", handleListNotifications)
	r.Get("/count", handleCountUnread)
	r.Post("/read-all", handleMarkAllRead)
	r.Post("/{id}/read", handleMarkRead)

	return r
}

func handleListNotifications(w http.ResponseWriter, r *http.Request) {
	ns, err := listNotifications(r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error fetching notifications: "+err.Error()))
		return
	}
	shared.WriteJSON(w, http.StatusOK, ns)
}

func handleCountUnread(w http.ResponseWriter, r *http.Request) {
	count, err := countUnreadNotifications(r.Context())
	if err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error counting notifications: "+err.Error()))
		return
	}
	shared.WriteJSON(w, http.StatusOK, map[string]int{"unread": count})
}

func handleMarkRead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := markNotificationRead(id, r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error marking notification read: "+err.Error()))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func handleMarkAllRead(w http.ResponseWriter, r *http.Request) {
	if err := markAllNotificationsRead(r.Context()); err != nil {
		shared.WriteError(w, shared.NewAPIError(http.StatusInternalServerError, "Error marking all notifications read: "+err.Error()))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

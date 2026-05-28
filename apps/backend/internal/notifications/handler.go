package notifications

import (
	"encoding/json"
	"net/http"

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
		http.Error(w, "Error fetching notifications: "+err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, ns)
}

func handleCountUnread(w http.ResponseWriter, r *http.Request) {
	count, err := countUnreadNotifications(r.Context())
	if err != nil {
		http.Error(w, "Error counting notifications: "+err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{"unread": count})
}

func handleMarkRead(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := markNotificationRead(id, r.Context()); err != nil {
		http.Error(w, "Error marking notification read: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func handleMarkAllRead(w http.ResponseWriter, r *http.Request) {
	if err := markAllNotificationsRead(r.Context()); err != nil {
		http.Error(w, "Error marking all notifications read: "+err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		http.Error(w, "error encoding JSON: "+err.Error(), http.StatusInternalServerError)
	}
}

package documents

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func DocumentsRouter() http.Handler {
	r := chi.NewRouter()

	r.Get("/document/:id", handleGetDocument)
	r.Post("/document", handleCreateDocument)
	r.Put("/document/:id", handleUpdateDocument)
	r.Delete("/document/:id", handleDeleteDocument)

	return r
}
func handleGetDocument(w http.ResponseWriter, r *http.Request) {

}
func handleCreateDocument(w http.ResponseWriter, r *http.Request) {

}
func handleUpdateDocument(w http.ResponseWriter, r *http.Request) {

}
func handleDeleteDocument(w http.ResponseWriter, r *http.Request) {

}

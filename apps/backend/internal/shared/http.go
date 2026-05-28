package shared

import (
	"encoding/json"
	"net/http"
	"strings"
)

// WriteJSON writes a JSON response with the given status code
func WriteJSON(w http.ResponseWriter, statusCode int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	return json.NewEncoder(w).Encode(data)
}

// WriteError writes a JSON error response
func WriteError(w http.ResponseWriter, apiErr APIError) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(apiErr.StatusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": apiErr.Message})
}

// DecodeJSON validates Content-Type and decodes JSON request body
func DecodeJSON(r *http.Request, v interface{}) error {
	contentType := r.Header.Get("Content-Type")
	if contentType == "" || !strings.HasPrefix(contentType, "application/json") {
		return NewAPIError(http.StatusBadRequest, "Content-Type must be application/json")
	}

	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		return NewAPIError(http.StatusBadRequest, "Invalid JSON: "+err.Error())
	}

	return nil
}

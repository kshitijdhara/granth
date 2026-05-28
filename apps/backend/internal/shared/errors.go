package shared

import (
	"net/http"
)

// APIError represents an error response from the API
type APIError struct {
	StatusCode int
	Message    string
}

func (e APIError) Error() string {
	return e.Message
}

// Common errors
var (
	ErrUnauthorized        = APIError{StatusCode: http.StatusUnauthorized, Message: "Unauthorized"}
	ErrBadRequest          = APIError{StatusCode: http.StatusBadRequest, Message: "Bad request"}
	ErrNotFound            = APIError{StatusCode: http.StatusNotFound, Message: "Not found"}
	ErrInternalServer      = APIError{StatusCode: http.StatusInternalServerError, Message: "Internal server error"}
	ErrInvalidContentType  = APIError{StatusCode: http.StatusBadRequest, Message: "Content-Type must be application/json"}
	ErrInvalidJSON         = APIError{StatusCode: http.StatusBadRequest, Message: "Invalid JSON"}
)

// NewAPIError creates a new APIError with custom message
func NewAPIError(statusCode int, message string) APIError {
	return APIError{
		StatusCode: statusCode,
		Message:    message,
	}
}

// IsAPIError checks if an error is an APIError
func IsAPIError(err error) bool {
	_, ok := err.(APIError)
	return ok
}

// AsAPIError converts an error to APIError if possible
func AsAPIError(err error) (APIError, bool) {
	apiErr, ok := err.(APIError)
	return apiErr, ok
}

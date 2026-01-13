FROM golang:1.25
WORKDIR /app
COPY . .
RUN go build -o granth main.go
EXPOSE 8080
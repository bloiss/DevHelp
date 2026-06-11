FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN mkdir -p migrations && CGO_ENABLED=0 GOOS=linux go build -o bin/api ./cmd/api

# ─── Image finale (minimale) ─────────────
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/bin/api .
COPY --from=builder /app/migrations ./migrations

EXPOSE 8080
ENTRYPOINT ["./api"]

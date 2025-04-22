### --- Backend build stage ---
FROM golang:1.23.5-alpine AS backend

WORKDIR /app

COPY ./tgerminal ./

ENV CGO_ENABLED=0
ARG VERSION_INFO=dev-build

RUN go build -a -v \
  -ldflags="-s -w -extldflags 'static' -X main.VersionInfo=${VERSION_INFO}" \
  -o ./cloudsh ./cmd/main.go

### --- Frontend build stage ---
FROM node:21.0.0-alpine AS frontend

WORKDIR /frontend
COPY ./frontend ./
RUN npm install && npm run build

### --- Final image ---
FROM alpine:3.14.0

# Create user and minimal dependencies
RUN adduser -D -u 1000 user && \
    apk add --no-cache bash ncurses

WORKDIR /app

# Copy backend binary
COPY --from=backend /app/cloudsh ./cloudsh

# Copy frontend build output
COPY --from=frontend /frontend/dist ./dist

# Set permissions
RUN chown -R user:user /app

# Set env
ENV SERVER_PORT=8080
ENV WORKDIR=/app

USER user
WORKDIR /

ENTRYPOINT ["/app/cloudsh"]
CMD ["-staticDir=/app/dist"]


FROM golang:1.16-alpine AS backend
WORKDIR /go/src/cloudshell
COPY ./cmd ./cmd
COPY ./internal ./internal
COPY ./pkg ./pkg
COPY ./go.mod .
COPY ./go.sum .
ENV CGO_ENABLED=0
RUN go mod vendor
ARG VERSION_INFO=dev-build
RUN go build -a -v \
  -ldflags " \
  -s -w \
  -extldflags 'static' \
  -X main.VersionInfo='${VERSION_INFO}' \
  " \
  -o ./bin/cloudshell \
  ./cmd/cloudshell

FROM node:16.0.0-alpine AS frontend
WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install

FROM alpine:3.14.0
WORKDIR /app
RUN apk add --no-cache bash ncurses

# Copy the certificate into the container
COPY ./fullchain.pem /etc/letsencrypt/live/abobus.tech/fullchain.pem
COPY ./privkey.pem /etc/letsencrypt/live/abobus.tech/privkey.pem

COPY --from=backend /go/src/cloudshell/bin/cloudshell /app/cloudshell
COPY --from=frontend /app/node_modules /app/node_modules
COPY .public /app/public

# Set the environment variable for TLS_CERT
ENV SERVER_PORT=443
ENV TLS_CERT=/etc/letsencrypt/live/abobus.tech/fullchain.pem
ENV TLS_KEY=/etc/letsencrypt/live/abobus.tech/privkey.pem

RUN ln -s /app/cloudshell /usr/bin/cloudshell
RUN adduser -D -u 1000 user
RUN mkdir -p /home/user
RUN chown user:user /app -R
RUN chown user:user /etc/letsencrypt/live/abobus.tech -R

WORKDIR /
ENV WORKDIR=/app
USER user

ENTRYPOINT ["/app/cloudshell"]

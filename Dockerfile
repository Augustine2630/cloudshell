### --- Frontend build stage ---
FROM node:21.0.0-alpine AS frontend

WORKDIR /frontend
COPY ./frontend ./
RUN npm install && npm run build

### --- Final image ---
FROM node:21.0.0-alpine

# Install http-server globally
RUN npm install -g http-server

# Create app directory and set permissions
WORKDIR /app
COPY --from=frontend /frontend/dist ./dist

# Use a non-root user (optional, security best practice)
RUN adduser -D user && chown -R user:user /app
USER user

# Expose the port http-server will use
EXPOSE 8080

# Serve the frontend build
CMD ["http-server", "dist", "-p", "8080"]

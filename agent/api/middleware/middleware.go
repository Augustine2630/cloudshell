package middleware

import (
	"cloudagent/logger"
	"net/http"
	"time"
)

func AddIncomingRequestLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		then := time.Now()
		defer func() {
			if recovered := recover(); recovered != nil {
				logger.CreateRequestLog(r).Info("request errored out")
			}
		}()
		next.ServeHTTP(w, r)
		duration := time.Now().Sub(then)
		logger.CreateRequestLog(r).Infof("request completed in %vms", float64(duration.Nanoseconds())/1000000)
	})
}
func СorsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Разрешить доступ с любого источника (или укажи конкретный origin)
		w.Header().Set("Access-Control-Allow-Origin", "*")

		// Разрешить нужные заголовки и методы
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Если это preflight-запрос, верни просто 200
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

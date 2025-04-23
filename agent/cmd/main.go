package main

import (
	"cloudagent/api/middleware"
	"cloudagent/app"
	"cloudagent/internal/log"
	"cloudagent/logger"
	"cloudagent/pkg/xtermjs"
	"errors"
	"fmt"
	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
	"net/http"
	"os"
	"path"
	"strings"
	"time"
)

var VersionInfo string

func main() {
	if VersionInfo == "" {
		VersionInfo = "dev"
	}
	command := cobra.Command{
		Use:     "cloudagent",
		Short:   "Creates a web-based shell using xterm.js that links to an actual shell",
		Version: VersionInfo,
		RunE:    runE,
	}

	app.Conf.ApplyToCobra(&command)
	command.Execute()
}

func runE(_ *cobra.Command, _ []string) error {
	log.Init(log.Format(app.Conf.GetString("log-format")), log.Level(app.Conf.GetString("log-level")))

	command := app.Conf.GetString("command")
	connectionErrorLimit := app.Conf.GetInt("connection-error-limit")
	arguments := app.Conf.GetStringSlice("arguments")
	keepalivePingTimeout := time.Duration(app.Conf.GetInt("keepalive-ping-timeout")) * time.Second
	maxBufferSizeBytes := app.Conf.GetInt("max-buffer-size-bytes")
	pathXTermJS := app.Conf.GetString("path-xtermjs")
	workingDirectory := app.Conf.GetString("workdir")
	serverPort := app.Conf.GetInt("server-port")
	tlsCert := app.Conf.GetString("tls-cert")
	tlsKey := app.Conf.GetString("tls-key")
	allowedHostnames := app.Conf.GetStringSlice("allowed-hostnames")
	if !path.IsAbs(workingDirectory) {
		wd, err := os.Getwd()
		if err != nil {
			message := fmt.Sprintf("failed to get working directory: %s", err)
			log.Error(message)
			return errors.New(message)
		}
		workingDirectory = path.Join(wd, workingDirectory)
	}
	log.Infof("working directory     : '%s'", workingDirectory)
	log.Infof("command               : '%s'", command)
	log.Infof("arguments             : ['%s']", strings.Join(arguments, "', '"))
	log.Infof("connection error limit: %v", connectionErrorLimit)
	log.Infof("keepalive ping timeout: %v", keepalivePingTimeout)
	log.Infof("max buffer size       : %v bytes", maxBufferSizeBytes)
	log.Infof("xtermjs endpoint path : '%s'", pathXTermJS)
	log.Infof("serverPort            : %d", serverPort)
	log.Infof("tls cert              : %s", tlsCert)
	log.Infof("tls key               : %s", tlsKey)
	log.Infof("allowed hosts         : ['%s']", strings.Join(allowedHostnames, "', '"))
	// configure routing
	router := mux.NewRouter()

	// this is the endpoint for xterm.js to connect to
	xtermjsHandlerOptions := xtermjs.HandlerOpts{
		AllowedHostnames:     allowedHostnames,
		Arguments:            arguments,
		Command:              command,
		ConnectionErrorLimit: connectionErrorLimit,
		CreateLogger: func(connectionUUID string, r *http.Request) xtermjs.Logger {
			logger.CreateRequestLog(r, map[string]interface{}{"connection_uuid": connectionUUID}).Infof("created logger for connection '%s'", connectionUUID)
			return logger.CreateRequestLog(nil, map[string]interface{}{"connection_uuid": connectionUUID})
		},
		KeepalivePingTimeout: keepalivePingTimeout,
		MaxBufferSizeBytes:   maxBufferSizeBytes,
	}
	router.HandleFunc(pathXTermJS, xtermjs.GetHandler(xtermjsHandlerOptions))

	// version endpoint
	router.HandleFunc("/version", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(VersionInfo))
	})
	// start memory logging pulse
	logWithMemory := logger.CreateMemoryLog()
	go func(tick *time.Ticker) {
		for {
			logWithMemory.Debug("tick")
			<-tick.C
		}
	}(time.NewTicker(time.Second * 30))

	corsWrappedRouter := middleware.СorsMiddleware(router)
	handler := middleware.AddIncomingRequestLogging(corsWrappedRouter)

	listenOnAddress := fmt.Sprintf("%s:%v", "0.0.0.0", serverPort)
	server := http.Server{
		Addr:    listenOnAddress,
		Handler: handler,
	}

	router.HandleFunc("/live", func(writer http.ResponseWriter, request *http.Request) {
		writer.WriteHeader(http.StatusOK)
		fmt.Fprintln(writer, "OK")
	}).Methods("GET")

	log.Infof("starting server on interface:port '%s'...", listenOnAddress)
	if tlsCert != "" && tlsKey != "" {
		return server.ListenAndServeTLS(tlsCert, tlsKey)
	}
	return server.ListenAndServe()
}

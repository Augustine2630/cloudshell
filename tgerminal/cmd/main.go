package main

import (
	"flag"
	"log"
	"net/http"
	"os"
)

func main() {
	// Флаг для указания директории со статикой
	staticDir := flag.String("staticDir", "frontend/dist", "Path to the static files directory")
	flag.Parse()

	// Проверка, что директория существует
	if _, err := os.Stat(*staticDir); os.IsNotExist(err) {
		log.Fatalf("Directory %s does not exist", *staticDir)
	}

	// Отдача статики
	fs := http.FileServer(http.Dir(*staticDir))
	http.Handle("/front", fs)

	// Получение порта из переменной окружения
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server started on http://localhost:%s (serving from %s)\n", port, *staticDir)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal(err)
	}
}

package config

import "log"

var Logger *log.Logger

func InitLogger() *log.Logger {
	Logger = log.Default()
	Logger.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	return Logger
}

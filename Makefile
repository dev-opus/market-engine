ROOT_DIR := $(shell pwd)

ifdef BUILD
BUILD_FLAG := --build
else
BUILD_FLAG :=
endif

.PHONY: deps simulators-build simulators-up simulators-down redis-up redis-down engine-up engine-dev up down

deps:
	npm install --prefix $(ROOT_DIR)/exchange-simulator
	npm install --prefix $(ROOT_DIR)/trading-engine

simulators-build:
	cd $(ROOT_DIR)/exchange-simulator && docker compose build

simulators-up:
	cd $(ROOT_DIR)/exchange-simulator && docker compose up -d $(BUILD_FLAG)

simulators-down:
	cd $(ROOT_DIR)/exchange-simulator && docker compose down

redis-up:
	cd $(ROOT_DIR)/trading-engine && docker compose up -d

redis-down:
	cd $(ROOT_DIR)/trading-engine && docker compose down

engine-up:
	cd $(ROOT_DIR)/trading-engine && REDIS_URL=redis://localhost:6379 EXCHANGES_AND_BASE_URLS='{"binance":"http://localhost:3000","coinbase":"http://localhost:3001","kraken":"http://localhost:3002"}' npm run start:prod

engine-dev:
	cd $(ROOT_DIR)/trading-engine && REDIS_URL=redis://localhost:6379 EXCHANGES_AND_BASE_URLS='{"binance":"http://localhost:3000","coinbase":"http://localhost:3001","kraken":"http://localhost:3002"}' npm run start:dev

up: simulators-up redis-up engine-up

down: simulators-down redis-down engine-down

SHELL := /bin/bash

API_PORT ?= 3001
WEB_PORT ?= 5173
SHORT_URL_BASE ?= http://localhost:$(API_PORT)

POSTGRES_CONTAINER := tinylink-postgres-dev
REDIS_CONTAINER := tinylink-redis-dev

.DEFAULT_GOAL := run
.PHONY: run infra migrate install

run: infra migrate
	@echo "API http://localhost:$(API_PORT)  WEB http://localhost:$(WEB_PORT)  (Ctrl+C stops everything)"
	@trap 'trap - INT TERM EXIT; kill 0' INT TERM EXIT; \
	( cd backend && PORT=$(API_PORT) SHORT_URL_BASE=$(SHORT_URL_BASE) npm run start:api:dev 2>&1 \
		| sed -u $$'s/^/\033[36m[api]    \033[0m/' ) & \
	( cd backend && npm run start:worker:dev 2>&1 \
		| sed -u $$'s/^/\033[35m[worker] \033[0m/' ) & \
	( cd frontend && VITE_API_PROXY_TARGET=http://localhost:$(API_PORT) npm run dev -- --port $(WEB_PORT) 2>&1 \
		| sed -u $$'s/^/\033[32m[web]    \033[0m/' ) & \
	wait

infra:
	@if ! docker ps --format '{{.Names}}' | grep -qx '$(POSTGRES_CONTAINER)'; then \
		if docker ps -a --format '{{.Names}}' | grep -qx '$(POSTGRES_CONTAINER)'; then \
			docker start $(POSTGRES_CONTAINER) >/dev/null; \
		else \
			docker run -d --name $(POSTGRES_CONTAINER) \
				-e POSTGRES_USER=tinylink -e POSTGRES_PASSWORD=tinylink -e POSTGRES_DB=tinylink \
				-p 5434:5432 postgres:16 >/dev/null; \
		fi; \
		echo "started postgres ($(POSTGRES_CONTAINER) on 5434)"; \
	fi
	@until docker exec $(POSTGRES_CONTAINER) pg_isready -U tinylink -q; do sleep 0.5; done
	@if ! (exec 3<>/dev/tcp/127.0.0.1/6379) 2>/dev/null; then \
		if docker ps -a --format '{{.Names}}' | grep -qx '$(REDIS_CONTAINER)'; then \
			docker start $(REDIS_CONTAINER) >/dev/null; \
		else \
			docker run -d --name $(REDIS_CONTAINER) -p 6379:6379 redis:7 >/dev/null; \
		fi; \
		echo "started redis ($(REDIS_CONTAINER) on 6379)"; \
	fi

migrate:
	@cd backend && npx prisma migrate deploy

install:
	cd backend && npm install
	cd frontend && npm install

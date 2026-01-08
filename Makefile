.PHONY: help up down build logs clean restart dev-backend dev-frontend migrate test

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Detect docker-compose command (V1 or V2)
DOCKER_COMPOSE := $(shell if command -v docker-compose > /dev/null 2>&1; then echo "docker-compose"; else echo "docker compose"; fi)

help: ## Show this help message
	@echo "$(BLUE)SU Booking Room - Available Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# Docker Commands
up: ## Start all services with Docker Compose
	@echo "$(BLUE)Starting all services...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ All services started!$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Backend:  http://localhost:8000$(NC)"
	@echo "$(YELLOW)Database: localhost:5432$(NC)"

down: ## Stop all services
	@echo "$(BLUE)Stopping all services...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ All services stopped!$(NC)"

build: ## Build all Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	$(DOCKER_COMPOSE) build --no-cache
	@echo "$(GREEN)✓ Build complete!$(NC)"

rebuild: ## Rebuild and restart all services
	@echo "$(BLUE)Rebuilding and restarting...$(NC)"
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) build --no-cache
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ Rebuild complete!$(NC)"

restart: ## Restart all services
	@echo "$(BLUE)Restarting all services...$(NC)"
	$(DOCKER_COMPOSE) restart
	@echo "$(GREEN)✓ All services restarted!$(NC)"

logs: ## Show logs from all services
	$(DOCKER_COMPOSE) logs -f

logs-backend: ## Show backend logs
	$(DOCKER_COMPOSE) logs -f backend

logs-frontend: ## Show frontend logs
	$(DOCKER_COMPOSE) logs -f frontend

logs-db: ## Show database logs
	$(DOCKER_COMPOSE) logs -f postgres

# Development Commands
dev-backend: ## Run backend in development mode
	@echo "$(BLUE)Starting backend in development mode...$(NC)"
	cd backend && go run main.go

dev-frontend: ## Run frontend in development mode
	@echo "$(BLUE)Starting frontend in development mode...$(NC)"
	cd frontend && npm run dev

# Database Commands
db-shell: ## Open PostgreSQL shell
	$(DOCKER_COMPOSE) exec postgres psql -U sumbenz -d su_booking_room

db-reset: ## Reset database (⚠️ WARNING: This will delete all data!)
	@echo "$(RED)⚠️  WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE) down -v; \
		$(DOCKER_COMPOSE) up -d postgres; \
		echo "$(GREEN)✓ Database reset complete!$(NC)"; \
	else \
		echo "$(YELLOW)Database reset cancelled.$(NC)"; \
	fi

# Cleanup Commands
clean: ## Clean up Docker resources
	@echo "$(BLUE)Cleaning up Docker resources...$(NC)"
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)✓ Cleanup complete!$(NC)"

clean-all: ## Clean up everything including images
	@echo "$(RED)⚠️  WARNING: This will remove all Docker images!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans; \
		docker system prune -af; \
		echo "$(GREEN)✓ All Docker resources cleaned!$(NC)"; \
	else \
		echo "$(YELLOW)Cleanup cancelled.$(NC)"; \
	fi

# Testing Commands
test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && go test -v ./...

# Build Commands (Local)
build-backend: ## Build backend binary
	@echo "$(BLUE)Building backend...$(NC)"
	cd backend && go build -o bin/server main.go
	@echo "$(GREEN)✓ Backend built successfully! Binary: backend/bin/server$(NC)"

build-frontend: ## Build frontend
	@echo "$(BLUE)Building frontend...$(NC)"
	cd frontend && npm run build
	@echo "$(GREEN)✓ Frontend built successfully!$(NC)"

# Status Commands
status: ## Show status of all services
	@echo "$(BLUE)Services Status:$(NC)"
	@$(DOCKER_COMPOSE) ps

ps: status ## Alias for status

# Installation Commands
install-backend: ## Install backend dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && go mod download
	@echo "$(GREEN)✓ Backend dependencies installed!$(NC)"

install-frontend: ## Install frontend dependencies
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed!$(NC)"

install: install-backend install-frontend ## Install all dependencies

# Default target
.DEFAULT_GOAL := help

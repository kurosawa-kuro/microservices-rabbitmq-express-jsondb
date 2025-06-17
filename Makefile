.PHONY: install start stop clean

# サービス名の定義
SERVICES = user client product api-gateway

# インストール
install:
	@echo "Installing dependencies..."
	@for service in $(SERVICES); do \
		echo "Installing $$service..."; \
		if [ "$$service" = "api-gateway" ]; then \
			cd api-gateway && npm install; \
		else \
			cd services/$$service && npm install; \
		fi; \
		cd ../..; \
	done

# 開発モードで起動
start:
	@echo "Starting all services..."
	@for service in $(SERVICES); do \
		echo "Starting $$service..."; \
		if [ "$$service" = "api-gateway" ]; then \
			cd "$(CURDIR)/api-gateway" && npm run dev & \
		else \
			cd "$(CURDIR)/services/$$service" && npm run dev & \
		fi; \
		cd "$(CURDIR)"; \
	done

# 本番モードで起動
start-prod:
	@echo "Starting all services in production mode..."
	@for service in $(SERVICES); do \
		echo "Starting $$service..."; \
		if [ "$$service" = "api-gateway" ]; then \
			cd "$(CURDIR)/api-gateway" && npm start & \
		else \
			cd "$(CURDIR)/services/$$service" && npm start & \
		fi; \
		cd "$(CURDIR)"; \
	done

# サービスを停止 port番号を指定して停止 8001,8002,8003,8004
stop:
	@echo "Stopping all services..."
	@pkill -f "node.*services/user" || true
	@pkill -f "node.*services/client" || true
	@pkill -f "node.*services/product" || true
	@pkill -f "node.*api-gateway" || true

# ポート番号を指定してサービスを停止
stop-by-port:
	@echo "Stopping services by port..."
	@for port in 8000 8001 8002 8003 8004; do \
		pid=$$(lsof -ti:$$port); \
		if [ ! -z "$$pid" ]; then \
			echo "Stopping service on port $$port (PID: $$pid)"; \
			kill $$pid || true; \
		else \
			echo "No service running on port $$port"; \
		fi; \
	done

# クリーンアップ
clean:
	@echo "Cleaning up..."
	@rm -rf node_modules
	@for service in $(SERVICES); do \
		if [ "$$service" = "api-gateway" ]; then \
			rm -rf api-gateway/node_modules; \
		else \
			rm -rf services/$$service/node_modules; \
		fi; \
	done

# ヘルプ
help:
	@echo "Available commands:"
	@echo "  make install     - Install dependencies for all services"
	@echo "  make start       - Start all services in development mode"
	@echo "  make start-prod  - Start all services in production mode"
	@echo "  make stop        - Stop all services"
	@echo "  make stop-by-port - Stop services by port (8001,8002,8003,8004)"
	@echo "  make clean       - Remove node_modules from all services"
	@echo "  make help        - Show this help message"

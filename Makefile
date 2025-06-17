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
			cd api-gateway && npm run dev & \
		else \
			cd services/$$service && npm run dev & \
		fi; \
		cd ../..; \
	done

# 本番モードで起動
start-prod:
	@echo "Starting all services in production mode..."
	@for service in $(SERVICES); do \
		echo "Starting $$service..."; \
		if [ "$$service" = "api-gateway" ]; then \
			cd api-gateway && npm start & \
		else \
			cd services/$$service && npm start & \
		fi; \
		cd ../..; \
	done

# サービスを停止
stop:
	@echo "Stopping all services..."
	@pkill -f "node.*services/user" || true
	@pkill -f "node.*services/client" || true
	@pkill -f "node.*services/product" || true
	@pkill -f "node.*api-gateway" || true

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
	@echo "  make clean       - Remove node_modules from all services"
	@echo "  make help        - Show this help message"

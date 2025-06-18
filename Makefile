# =============================================================================
# 変数定義
# =============================================================================

# サービス名の定義
SERVICES = user order product api-gateway

# ポート番号の定義
USER_PORT = 8001
PRODUCT_PORT = 8002
ORDER_PORT = 8003
API_GATEWAY_PORT = 8000
RABBITMQ_PORT = 5672
RABBITMQ_MANAGEMENT_PORT = 15672

# =============================================================================
# ターゲット定義
# =============================================================================

.PHONY: help
.PHONY: install clean
.PHONY: start start-prod stop
.PHONY: k8s-setup k8s-build k8s-deploy k8s-delete
.PHONY: k8s-logs k8s-status
.PHONY: k8s-port-forward k8s-port-forward-all k8s-port-forward-stop

# =============================================================================
# 開発環境コマンド
# =============================================================================

# 依存関係のインストール
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

# =============================================================================
# サービス起動コマンド
# =============================================================================

# 開発モードで起動
start:
	@echo "Starting all services in development mode..."
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

# サービスを停止
stop:
	@echo "Stopping all services..."
	@bash -c 'for service in $(SERVICES); do \
		echo "Stopping $$service..."; \
		if [ "$$service" = "api-gateway" ]; then \
			pkill -9 -f "node.*api-gateway" 2>/dev/null || true; \
		else \
			pkill -9 -f "node.*services/$$service" 2>/dev/null || true; \
		fi; \
	done'
	@bash -c 'for port in 8000 8001 8002 8003 8004; do \
		pid=$$(lsof -ti:$$port 2>/dev/null); \
		if [ ! -z "$$pid" ]; then \
			echo "Stopping service on port $$port (PID: $$pid)"; \
			kill -9 $$pid 2>/dev/null || true; \
		else \
			echo "No service running on port $$port"; \
		fi; \
	done'
	@echo "All services stopped."

# =============================================================================
# Kubernetesコマンド
# =============================================================================

# Kubernetes環境のセットアップ
k8s-setup:
	@echo "Setting up Kubernetes environment..."
	@kubectl create namespace microservices --dry-run=client -o yaml | kubectl apply -f -
	@echo "Kubernetes environment setup completed."

# Dockerイメージのビルド
k8s-build:
	@echo "Building Docker images..."
	@eval $$(minikube docker-env) && \
	for service in $(SERVICES); do \
		if [ "$$service" = "api-gateway" ]; then \
			docker build -t api-gateway:latest api-gateway/; \
		else \
			docker build -t $$service-service:latest services/$$service/; \
		fi; \
	done
	@echo "Docker images built successfully."

# Kubernetesへのデプロイ
k8s-deploy:
	@echo "Deploying services to Kubernetes..."
	@kubectl apply -f k8s/base/rabbitmq/
	@for service in $(SERVICES); do \
		if [ "$$service" != "api-gateway" ]; then \
			kubectl apply -f k8s/base/$$service-service/; \
		fi; \
	done
	@echo "Services deployed successfully."

# Kubernetesからの削除
k8s-delete:
	@echo "Deleting services from Kubernetes..."
	@for service in $(SERVICES); do \
		if [ "$$service" != "api-gateway" ]; then \
			kubectl delete -f k8s/base/$$service-service/; \
		fi; \
	done
	@kubectl delete -f k8s/base/rabbitmq/
	@echo "Services deleted successfully."

# =============================================================================
# Kubernetes監視コマンド
# =============================================================================

# ログの確認
k8s-logs:
	@echo "Showing logs for all services..."
	@for service in $(SERVICES); do \
		if [ "$$service" != "api-gateway" ]; then \
			echo "=== $$service-service logs ==="; \
			kubectl logs -n microservices -l app=$$service-service --tail=50; \
			echo ""; \
		fi; \
	done

# サービスの状態確認
k8s-status:
	@echo "Checking service status..."
	@kubectl get pods -n microservices
	@echo ""
	@kubectl get services -n microservices

# =============================================================================
# Kubernetesポートフォワーディングコマンド
# =============================================================================

# ポートフォワーディング（個別サービス）
k8s-port-forward:
	@echo "Port forwarding for individual services:"
	@echo "  make k8s-port-forward SERVICE=user    - Forward user service (port $(USER_PORT))"
	@echo "  make k8s-port-forward SERVICE=product - Forward product service (port $(PRODUCT_PORT))"
	@echo "  make k8s-port-forward SERVICE=order   - Forward order service (port $(ORDER_PORT))"
	@echo "  make k8s-port-forward SERVICE=rabbitmq - Forward RabbitMQ (ports $(RABBITMQ_PORT),$(RABBITMQ_MANAGEMENT_PORT))"
	@if [ "$(SERVICE)" = "user" ]; then \
		kubectl port-forward -n microservices svc/user-service $(USER_PORT):$(USER_PORT); \
	elif [ "$(SERVICE)" = "product" ]; then \
		kubectl port-forward -n microservices svc/product-service $(PRODUCT_PORT):$(PRODUCT_PORT); \
	elif [ "$(SERVICE)" = "order" ]; then \
		kubectl port-forward -n microservices svc/order-service $(ORDER_PORT):$(ORDER_PORT); \
	elif [ "$(SERVICE)" = "rabbitmq" ]; then \
		kubectl port-forward -n microservices svc/rabbitmq $(RABBITMQ_PORT):$(RABBITMQ_PORT) $(RABBITMQ_MANAGEMENT_PORT):$(RABBITMQ_MANAGEMENT_PORT); \
	else \
		echo "Invalid service name. Please specify one of: user, product, order, rabbitmq"; \
		exit 1; \
	fi

# ポートフォワーディング（全サービス）
k8s-port-forward-all:
	@echo "Starting port forwarding for all services..."
	@kubectl port-forward -n microservices svc/user-service $(USER_PORT):$(USER_PORT) & \
	kubectl port-forward -n microservices svc/product-service $(PRODUCT_PORT):$(PRODUCT_PORT) & \
	kubectl port-forward -n microservices svc/order-service $(ORDER_PORT):$(ORDER_PORT) & \
	kubectl port-forward -n microservices svc/rabbitmq $(RABBITMQ_PORT):$(RABBITMQ_PORT) $(RABBITMQ_MANAGEMENT_PORT):$(RABBITMQ_MANAGEMENT_PORT) & \
	echo "Port forwarding started. Use 'make k8s-port-forward-stop' to stop."

# ポートフォワーディングの停止
k8s-port-forward-stop:
	@echo "Stopping all port forwarding..."
	@pkill -f "kubectl port-forward" || true
	@echo "Port forwarding stopped."

# =============================================================================
# ヘルプ
# =============================================================================

help:
	@echo "Available commands:"
	@echo ""
	@echo "Development Commands:"
	@echo "  make install     - Install dependencies for all services"
	@echo "  make clean       - Remove node_modules from all services"
	@echo ""
	@echo "Service Commands:"
	@echo "  make start       - Start all services in development mode"
	@echo "  make start-prod  - Start all services in production mode"
	@echo "  make stop        - Stop all services"
	@echo ""
	@echo "Kubernetes Commands:"
	@echo "  make k8s-setup   - Set up Kubernetes environment"
	@echo "  make k8s-build   - Build Docker images for all services"
	@echo "  make k8s-deploy  - Deploy all services to Kubernetes"
	@echo "  make k8s-delete  - Delete all services from Kubernetes"
	@echo ""
	@echo "Kubernetes Monitoring:"
	@echo "  make k8s-logs    - Show logs for all services"
	@echo "  make k8s-status  - Show status of all services"
	@echo ""
	@echo "Kubernetes Port Forwarding:"
	@echo "  make k8s-port-forward SERVICE=<name> - Forward ports for a specific service"
	@echo "  make k8s-port-forward-all           - Forward ports for all services"
	@echo "  make k8s-port-forward-stop          - Stop all port forwarding"
	@echo ""
	@echo "Help:"
	@echo "  make help        - Show this help message"

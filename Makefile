# =============================================================================
# 変数定義
# =============================================================================

# 環境設定
NAMESPACE        ?= microservices
PROFILE          ?= development
SERVICES         := user order product api-gateway

# ポート設定
USER_PORT        := 8001
PRODUCT_PORT     := 8002
ORDER_PORT       := 8003
API_GATEWAY_PORT := 8000
RABBIT_PORT      := 5672
RABBIT_MGMT_PORT := 15672

# ポートフォワーディング用PIDファイル
PORT_FWD_PIDS = /tmp/$(NAMESPACE)-portfwd.pids

# =============================================================================
# ターゲット定義
# =============================================================================

.PHONY: help
.PHONY: install clean
.PHONY: start start-prod stop
.PHONY: k8s-setup k8s-build k8s-deploy k8s-delete
.PHONY: k8s-logs k8s-status
.PHONY: port-fwd-all port-fwd-stop

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
	@kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	@echo "Kubernetes environment setup completed."

# Dockerイメージのビルド
k8s-build:
	@echo "Building Docker images..."
	@for svc in $(SERVICES); do \
		img=$$([ "$$svc" = "api-gateway" ] && echo api-gateway || echo $$svc-service); \
		ctx=$$([ "$$svc" = "api-gateway" ] && echo api-gateway || echo services/$$svc); \
		echo "Building $$img..."; \
		docker build -t $$img:latest $$ctx; \
	done
	@echo "Docker images built successfully."

# Kubernetesへのデプロイ
k8s-deploy:
	@echo "Deploying services to Kubernetes..."
	@echo "Applying RabbitMQ & base configuration..."
	@kubectl apply -k k8s/base/rabbitmq
	@echo "Applying overlay: $(PROFILE)"
	@kubectl apply -k k8s/overlays/$(PROFILE)
	@echo "Services deployed successfully."

# Kubernetesからの削除
k8s-delete:
	@echo "Deleting services from Kubernetes..."
	@kubectl delete -k k8s/overlays/$(PROFILE) --ignore-not-found
	@kubectl delete -k k8s/base/rabbitmq --ignore-not-found
	@echo "Services deleted successfully."

# =============================================================================
# Kubernetes監視コマンド
# =============================================================================

# サービスの状態確認
k8s-status:
	@echo "Checking service status..."
	@kubectl get pods,svc -n $(NAMESPACE)

# ログの確認
k8s-logs:
	@echo "Showing logs for all services..."
	@kubectl logs -n $(NAMESPACE) -l app=$(LOG_APP) --tail=100 -f

# =============================================================================
# ポートフォワーディングコマンド
# =============================================================================

# ポートフォワーディング開始用マクロ
define start_pf
	@nohup kubectl -n $(NAMESPACE) port-forward svc/$1 $2 >/dev/null 2>&1 &
	@echo $$! >> $(PORT_FWD_PIDS)
endef

# ポートフォワーディング（全サービス）
port-fwd-all: port-fwd-stop
	@echo "Starting port forwarding for all services..."
	$(call start_pf,user-service,$(USER_PORT):$(USER_PORT))
	$(call start_pf,product-service,$(PRODUCT_PORT):$(PRODUCT_PORT))
	$(call start_pf,order-service,$(ORDER_PORT):$(ORDER_PORT))
	$(call start_pf,rabbitmq,$(RABBIT_PORT):$(RABBIT_PORT) $(RABBIT_MGMT_PORT):$(RABBIT_MGMT_PORT))
	@echo "Port forwarding started for:"
	@echo "  User Service:     $(USER_PORT)"
	@echo "  Product Service:  $(PRODUCT_PORT)"
	@echo "  Order Service:    $(ORDER_PORT)"
	@echo "  RabbitMQ:        $(RABBIT_PORT) (AMQP)"
	@echo "  RabbitMQ:        $(RABBIT_MGMT_PORT) (Management)"
	@echo "Use 'make port-fwd-stop' to stop port forwarding."

# ポートフォワーディングの停止
port-fwd-stop:
	@echo "Stopping all port forwarding..."
	@if [ -f $(PORT_FWD_PIDS) ]; then \
		xargs -r kill < $(PORT_FWD_PIDS) || true; \
		rm $(PORT_FWD_PIDS); \
	fi
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
	@echo "Port Forwarding:"
	@echo "  make port-fwd-all  - Forward ports for all services"
	@echo "  make port-fwd-stop - Stop all port forwarding"
	@echo ""
	@echo "Environment Variables:"
	@echo "  NAMESPACE        - Kubernetes namespace (default: microservices)"
	@echo "  PROFILE          - Kustomize profile (default: development)"
	@echo ""
	@echo "Help:"
	@echo "  make help        - Show this help message"

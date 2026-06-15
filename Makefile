MINIO_DATA   := /tmp/minio-data
MINIO_PID    := /tmp/devhelp-minio.pid
API_PID      := /tmp/devhelp-api.pid
FRONT_PID    := /tmp/devhelp-front.pid
WORKER_PID   := /tmp/devhelp-worker.pid
MINIO_LOG    := /tmp/devhelp-minio.log
API_LOG      := /tmp/devhelp-api.log
FRONT_LOG    := /tmp/devhelp-front.log
WORKER_LOG   := /tmp/devhelp-worker.log

.PHONY: dev stop worker logs-api logs-minio logs-front logs-worker

dev:
	@echo "▶  [1/3] MinIO (stockage images)..."
	@mkdir -p $(MINIO_DATA)
	@MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin \
		minio server $(MINIO_DATA) --address ":9000" --console-address ":9001" \
		> $(MINIO_LOG) 2>&1 & echo $$! > $(MINIO_PID)
	@sleep 1
	@curl -sf http://localhost:9000/minio/health/live > /dev/null \
		&& echo "   ✓ MinIO   → http://localhost:9000" \
		|| echo "   ✗ MinIO failed — make logs-minio"

	@echo "▶  [2/3] API backend..."
	@cd backend && go run ./cmd/api/main.go > $(API_LOG) 2>&1 & echo $$! > $(API_PID)
	@sleep 3
	@curl -sf http://localhost:8080/health > /dev/null \
		&& echo "   ✓ API     → http://localhost:8080" \
		|| echo "   ✗ API failed — make logs-api"

	@echo "▶  [3/3] Frontend React..."
	@cd frontend && npm run dev > $(FRONT_LOG) 2>&1 & echo $$! > $(FRONT_PID)
	@sleep 2
	@curl -sf http://localhost:5173 > /dev/null \
		&& echo "   ✓ Front   → http://localhost:5173" \
		|| echo "   ✗ Front failed — make logs-front"

	@echo ""
	@echo "✓ Stack complète. Ouvre http://localhost:5173"
	@echo "  Worker modération : make worker"
	@echo "  Arrêt : make stop"

worker:
	@echo "▶  Worker modération..."
	@cd worker && go run ./cmd > $(WORKER_LOG) 2>&1 & echo $$! > $(WORKER_PID)
	@sleep 2
	@grep -q "Consumer ready" $(WORKER_LOG) 2>/dev/null \
		&& echo "   ✓ Worker  → en écoute sur la queue de modération" \
		|| echo "   ✗ Worker failed — make logs-worker"

stop:
	@if [ -f $(FRONT_PID) ];  then kill $$(cat $(FRONT_PID))  2>/dev/null && rm $(FRONT_PID)  && echo "  Frontend arrêté";  fi
	@if [ -f $(API_PID) ];    then kill $$(cat $(API_PID))    2>/dev/null && rm $(API_PID)    && echo "  API arrêtée";      fi
	@if [ -f $(MINIO_PID) ];  then kill $$(cat $(MINIO_PID))  2>/dev/null && rm $(MINIO_PID)  && echo "  MinIO arrêté";     fi
	@if [ -f $(WORKER_PID) ]; then kill $$(cat $(WORKER_PID)) 2>/dev/null && rm $(WORKER_PID) && echo "  Worker arrêté";    fi

logs-api:
	@tail -f $(API_LOG)

logs-minio:
	@tail -f $(MINIO_LOG)

logs-front:
	@tail -f $(FRONT_LOG)

logs-worker:
	@tail -f $(WORKER_LOG)

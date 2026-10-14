#!/usr/bin/env bash
set -e

echo "=================================================="
echo "      SafeLabel AI — Azure Deployment Runner      "
echo "=================================================="

# 1. Detect or prompt for Azure Public IP
DETECTED_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "localhost")

echo ""
echo "Detected Public IP: ${DETECTED_IP}"
read -p "Enter Azure Public IP or Domain [Press Enter to use ${DETECTED_IP}]: " INPUT_IP
SERVER_IP=${INPUT_IP:-$DETECTED_IP}

echo ""
echo "Configuring SafeLabel AI with Server IP: ${SERVER_IP}"

# 2. Write root .env file for docker-compose
cat <<EOF > .env
AZURE_SERVER_IP=${SERVER_IP}
API_PORT=8000
ADMIN_PORT=3000
MOBILE_PORT=8081
POSTGRES_DB=safelabel
POSTGRES_USER=safelabel
POSTGRES_PASSWORD=safelabel
POSTGRES_PORT=5432
JWT_SECRET=change-me-to-a-secure-random-32-character-secret-key
EOF

# 3. Synchronize app/admin-panel/.env.local
cat <<EOF > app/admin-panel/.env.local
NEXT_PUBLIC_API_URL=http://${SERVER_IP}:8000
NEXT_PUBLIC_SERVER_IP=${SERVER_IP}
NEXT_PUBLIC_SERVER_PORT=8000
EOF

# 4. Synchronize app/mobile/.env
cat <<EOF > app/mobile/.env
EXPO_PUBLIC_API_URL=http://${SERVER_IP}:8000
EXPO_PUBLIC_SERVER_IP=${SERVER_IP}
EXPO_PUBLIC_SERVER_PORT=8000
EOF

# 5. Build and launch containers
echo ""
echo "Starting PostgreSQL, FastAPI Backend, Admin Panel, and Mobile Bundler..."
docker compose down || true
docker compose up -d --build

echo ""
echo "=================================================="
echo "          SafeLabel AI is now running!            "
echo "=================================================="
echo "  • FastAPI API:          http://${SERVER_IP}:8000"
echo "  • API Docs (Swagger):   http://${SERVER_IP}:8000/docs"
echo "  • Admin Panel:          http://${SERVER_IP}:3000"
echo "  • Mobile Metro Server:  http://${SERVER_IP}:8081"
echo "=================================================="
echo "To view live logs:        docker compose logs -f"
echo "To stop all services:     docker compose down"
echo "=================================================="

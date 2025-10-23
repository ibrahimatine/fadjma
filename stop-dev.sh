#!/bin/bash

# 🛑 FADJMA Development Stop Script
# Arrête proprement le backend et le frontend

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_PID_FILE=".backend.pid"
FRONTEND_PID_FILE=".frontend.pid"

echo -e "${YELLOW}🛑 Arrêt des services FADJMA...${NC}\n"

# Arrêter le backend
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${BLUE}Arrêt du backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        pkill -P $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Backend arrêté${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend déjà arrêté${NC}"
    fi
    rm -f "$BACKEND_PID_FILE"
else
    echo -e "${YELLOW}⚠️  Aucun PID backend trouvé${NC}"
    # Essayer de tuer par nom de processus
    pkill -f "nodemon.*server.js" 2>/dev/null
fi

echo ""

# Arrêter le frontend
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${BLUE}Arrêt du frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        pkill -P $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✓ Frontend arrêté${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend déjà arrêté${NC}"
    fi
    rm -f "$FRONTEND_PID_FILE"
else
    echo -e "${YELLOW}⚠️  Aucun PID frontend trouvé${NC}"
    # Essayer de tuer par nom de processus
    pkill -f "react-scripts start" 2>/dev/null
fi

echo ""
echo -e "${GREEN}✅ Services arrêtés${NC}"

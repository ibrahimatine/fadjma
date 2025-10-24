#!/bin/bash

# 📊 FADJMA Development Status Checker
# Affiche le statut des services

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND_PID_FILE=".backend.pid"
FRONTEND_PID_FILE=".frontend.pid"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📊 FADJMA Development Status${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Fonction pour vérifier le statut HTTP
check_http() {
    local url=$1
    local response=$(curl -s -o /dev/null -w "%{http_code}" $url 2>/dev/null)
    if [ "$response" == "200" ] || [ "$response" == "304" ]; then
        echo -e "${GREEN}✓ Accessible${NC}"
        return 0
    else
        echo -e "${RED}✗ Non accessible${NC}"
        return 1
    fi
}

# Backend Status
echo -e "${BLUE}🔧 Backend (Node.js/Express)${NC}"
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "   Status: ${GREEN}● Running${NC}"
        echo -e "   PID: $BACKEND_PID"
        echo -e "   URL: http://localhost:5000"
        echo -n "   HTTP: "
        check_http "http://localhost:5000/api/health"
    else
        echo -e "   Status: ${RED}● Stopped${NC} (PID file exists but process not running)"
    fi
else
    echo -e "   Status: ${RED}● Stopped${NC}"
fi

echo ""

# Frontend Status
echo -e "${MAGENTA}⚛️  Frontend (React)${NC}"
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "   Status: ${GREEN}● Running${NC}"
        echo -e "   PID: $FRONTEND_PID"
        echo -e "   URL: http://localhost:3000"
        echo -n "   HTTP: "
        check_http "http://localhost:3000"
    else
        echo -e "   Status: ${RED}● Stopped${NC} (PID file exists but process not running)"
    fi
else
    echo -e "   Status: ${RED}● Stopped${NC}"
fi

echo ""

# Ports Check
echo -e "${CYAN}🔌 Ports${NC}"
if lsof -i :5000 > /dev/null 2>&1; then
    echo -e "   5000 (Backend):  ${GREEN}● In use${NC}"
else
    echo -e "   5000 (Backend):  ${YELLOW}○ Available${NC}"
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo -e "   3000 (Frontend): ${GREEN}● In use${NC}"
else
    echo -e "   3000 (Frontend): ${YELLOW}○ Available${NC}"
fi

echo ""

# Node.js Version
echo -e "${CYAN}🟢 Environment${NC}"
if command -v node &> /dev/null; then
    echo -e "   Node.js: $(node --version)"
    echo -e "   npm: $(npm --version)"
else
    echo -e "   ${RED}Node.js not installed${NC}"
fi

echo ""

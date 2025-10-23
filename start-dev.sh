#!/bin/bash

# 🚀 FADJMA Development Starter Script
# Lance le backend et le frontend en parallèle

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fichiers PID pour tracker les processus
BACKEND_PID_FILE=".backend.pid"
FRONTEND_PID_FILE=".frontend.pid"

# Fichiers de logs
BACKEND_LOG="logs/backend-dev.log"
FRONTEND_LOG="logs/frontend-dev.log"

# Créer le dossier logs s'il n'existe pas
mkdir -p logs

# Fonction pour nettoyer les processus à l'arrêt
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt des services...${NC}"

    # Arrêter le backend
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${BLUE}Arrêt du backend (PID: $BACKEND_PID)...${NC}"
            kill $BACKEND_PID 2>/dev/null
            # Tuer aussi les processus enfants (nodemon)
            pkill -P $BACKEND_PID 2>/dev/null
        fi
        rm -f "$BACKEND_PID_FILE"
    fi

    # Arrêter le frontend
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${MAGENTA}Arrêt du frontend (PID: $FRONTEND_PID)...${NC}"
            kill $FRONTEND_PID 2>/dev/null
            # Tuer aussi les processus enfants (react-scripts)
            pkill -P $FRONTEND_PID 2>/dev/null
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi

    echo -e "${GREEN}✅ Services arrêtés${NC}"
    exit 0
}

# Trap pour gérer CTRL+C proprement
trap cleanup SIGINT SIGTERM

# Banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║        🏥 FADJMA Development Environment 🚀          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé!${NC}"
    echo -e "${YELLOW}📥 Installez Node.js depuis https://nodejs.org/${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✓ npm version: $(npm --version)${NC}\n"

# Vérifier si les dépendances sont installées
echo -e "${YELLOW}🔍 Vérification des dépendances...${NC}"

if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances backend...${NC}"
    cd backend && npm install && cd ..
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors de l'installation des dépendances backend${NC}"
        exit 1
    fi
fi

if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances frontend...${NC}"
    cd frontend && npm install && cd ..
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors de l'installation des dépendances frontend${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Dépendances OK${NC}\n"

# Vérifier si les fichiers .env existent
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Fichier backend/.env non trouvé${NC}"
    if [ -f "backend/.env.example" ]; then
        echo -e "${CYAN}📝 Copie de .env.example vers .env...${NC}"
        cp backend/.env.example backend/.env
        echo -e "${YELLOW}⚠️  N'oubliez pas de configurer backend/.env avec vos credentials Hedera!${NC}\n"
    else
        echo -e "${RED}❌ Aucun fichier .env.example trouvé${NC}"
    fi
fi

if [ ! -f "frontend/.env" ]; then
    if [ -f "frontend/.env.example" ]; then
        echo -e "${CYAN}📝 Copie de frontend/.env.example vers .env...${NC}"
        cp frontend/.env.example frontend/.env
    fi
fi

# Nettoyer les anciens fichiers PID
rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"

# Démarrer le backend
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔧 Démarrage du BACKEND (Node.js/Express)...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd backend

# Démarrer le backend en arrière-plan
npm run dev > "../$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "../$BACKEND_PID_FILE"

cd ..

echo -e "${GREEN}✓ Backend démarré (PID: $BACKEND_PID)${NC}"
echo -e "${CYAN}📋 Logs: $BACKEND_LOG${NC}"
echo -e "${CYAN}🌐 URL: http://localhost:5000${NC}\n"

# Attendre que le backend démarre (max 30 secondes)
echo -e "${YELLOW}⏳ Attente du démarrage du backend...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend prêt!${NC}\n"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠️  Le backend met du temps à démarrer (normal au premier lancement)${NC}\n"
    fi
    sleep 1
done

# Démarrer le frontend
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${MAGENTA}⚛️  Démarrage du FRONTEND (React)...${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd frontend

# Désactiver l'ouverture automatique du navigateur
export BROWSER=none

# Démarrer le frontend en arrière-plan
npm start > "../$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "../$FRONTEND_PID_FILE"

cd ..

echo -e "${GREEN}✓ Frontend démarré (PID: $FRONTEND_PID)${NC}"
echo -e "${CYAN}📋 Logs: $FRONTEND_LOG${NC}"
echo -e "${CYAN}🌐 URL: http://localhost:3000${NC}\n"

# Afficher le statut
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ FADJMA en cours d'exécution!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}📊 Services:${NC}"
echo -e "   ${BLUE}Backend:${NC}  http://localhost:5000 (PID: $BACKEND_PID)"
echo -e "   ${MAGENTA}Frontend:${NC} http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo -e "${CYAN}📋 Logs:${NC}"
echo -e "   ${BLUE}Backend:${NC}  tail -f $BACKEND_LOG"
echo -e "   ${MAGENTA}Frontend:${NC} tail -f $FRONTEND_LOG"
echo ""
echo -e "${CYAN}🔧 Commandes utiles:${NC}"
echo -e "   ${YELLOW}Arrêter:${NC}     Ctrl+C ou ./stop-dev.sh"
echo -e "   ${YELLOW}Logs live:${NC}   ./logs-dev.sh"
echo -e "   ${YELLOW}Statut:${NC}      ./status-dev.sh"
echo ""
echo -e "${YELLOW}💡 Appuyez sur Ctrl+C pour arrêter tous les services${NC}\n"

# Attendre indéfiniment (les processus tournent en arrière-plan)
# Le script reste actif pour capturer Ctrl+C
while true; do
    # Vérifier si les processus sont toujours actifs
    if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ Le backend s'est arrêté de manière inattendue!${NC}"
        echo -e "${YELLOW}📋 Vérifiez les logs: $BACKEND_LOG${NC}"
        cleanup
    fi

    if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${RED}❌ Le frontend s'est arrêté de manière inattendue!${NC}"
        echo -e "${YELLOW}📋 Vérifiez les logs: $FRONTEND_LOG${NC}"
        cleanup
    fi

    sleep 5
done

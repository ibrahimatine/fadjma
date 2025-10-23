#!/bin/bash

# 🎯 FADJMA Development Menu
# Menu interactif pour gérer l'environnement de développement

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Fonction pour afficher le menu
show_menu() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     🏥 FADJMA Development Environment Menu 🚀        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}📊 Services:${NC}"

    # Vérifier le statut
    if [ -f ".backend.pid" ] && ps -p $(cat .backend.pid) > /dev/null 2>&1; then
        echo -e "   Backend:  ${GREEN}● Running${NC}"
    else
        echo -e "   Backend:  ${RED}○ Stopped${NC}"
    fi

    if [ -f ".frontend.pid" ] && ps -p $(cat .frontend.pid) > /dev/null 2>&1; then
        echo -e "   Frontend: ${GREEN}● Running${NC}"
    else
        echo -e "   Frontend: ${RED}○ Stopped${NC}"
    fi

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Commandes:${NC}"
    echo ""
    echo -e "  ${GREEN}1${NC}) 🚀 Démarrer tout (backend + frontend)"
    echo -e "  ${GREEN}2${NC}) 🛑 Arrêter tout"
    echo -e "  ${GREEN}3${NC}) 📊 Voir le statut"
    echo -e "  ${GREEN}4${NC}) 📋 Voir les logs"
    echo ""
    echo -e "  ${BLUE}5${NC}) 🔧 Démarrer backend uniquement"
    echo -e "  ${BLUE}6${NC}) ⚛️  Démarrer frontend uniquement"
    echo ""
    echo -e "  ${MAGENTA}7${NC}) 🔄 Redémarrer tout"
    echo -e "  ${MAGENTA}8${NC}) 🧹 Nettoyer (logs + cache)"
    echo -e "  ${MAGENTA}9${NC}) 📦 Réinstaller dépendances"
    echo ""
    echo -e "  ${CYAN}10${NC}) 🌐 Ouvrir les URLs"
    echo -e "  ${CYAN}11${NC}) 📚 Voir la documentation"
    echo ""
    echo -e "  ${RED}0${NC}) ❌ Quitter"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Fonction pour attendre une touche
wait_key() {
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
}

# Fonction pour démarrer le backend uniquement
start_backend() {
    echo -e "${BLUE}🔧 Démarrage du backend...${NC}"
    cd backend
    npm run dev > ../logs/backend-dev.log 2>&1 &
    echo $! > ../.backend.pid
    cd ..
    echo -e "${GREEN}✓ Backend démarré (PID: $(cat .backend.pid))${NC}"
    wait_key
}

# Fonction pour démarrer le frontend uniquement
start_frontend() {
    echo -e "${MAGENTA}⚛️  Démarrage du frontend...${NC}"
    cd frontend
    export BROWSER=none
    npm start > ../logs/frontend-dev.log 2>&1 &
    echo $! > ../.frontend.pid
    cd ..
    echo -e "${GREEN}✓ Frontend démarré (PID: $(cat .frontend.pid))${NC}"
    wait_key
}

# Fonction pour nettoyer
clean_env() {
    echo -e "${YELLOW}🧹 Nettoyage de l'environnement...${NC}"

    echo -e "Suppression des logs..."
    rm -rf logs/*.log

    echo -e "Suppression des fichiers PID..."
    rm -f .backend.pid .frontend.pid

    echo -e "Suppression du cache npm..."
    npm cache clean --force

    echo -e "${GREEN}✓ Nettoyage terminé${NC}"
    wait_key
}

# Fonction pour réinstaller les dépendances
reinstall_deps() {
    echo -e "${YELLOW}📦 Réinstallation des dépendances...${NC}"

    echo -e "\n${BLUE}Backend...${NC}"
    cd backend
    rm -rf node_modules package-lock.json
    npm install
    cd ..

    echo -e "\n${MAGENTA}Frontend...${NC}"
    cd frontend
    rm -rf node_modules package-lock.json
    npm install
    cd ..

    echo -e "\n${GREEN}✓ Réinstallation terminée${NC}"
    wait_key
}

# Fonction pour ouvrir les URLs
open_urls() {
    echo -e "${CYAN}🌐 Ouverture des URLs...${NC}"

    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000 2>/dev/null
        xdg-open http://localhost:5000/api/health 2>/dev/null
    elif command -v open &> /dev/null; then
        open http://localhost:3000
        open http://localhost:5000/api/health
    else
        echo -e "${YELLOW}URLs:${NC}"
        echo -e "  Frontend: http://localhost:3000"
        echo -e "  Backend:  http://localhost:5000"
    fi

    wait_key
}

# Fonction pour voir la documentation
show_docs() {
    clear
    echo -e "${CYAN}📚 Documentation${NC}"
    echo ""
    echo -e "${YELLOW}Fichiers disponibles:${NC}"
    echo ""
    echo "  1. README.md - Vue d'ensemble"
    echo "  2. DEVELOPMENT.md - Guide de développement"
    echo "  3. PLAN_ARCHITECTURE_COMPLET.md - Architecture"
    echo "  4. docs/CAHIER_DES_CHARGES_FADJMA.md - Cahier des charges"
    echo "  5. docs/PLAN_PHASE_1_Q1_2025.md - Roadmap Phase 1"
    echo ""
    echo -e "${YELLOW}URLs utiles:${NC}"
    echo ""
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:5000/api"
    echo "  - Health Check: http://localhost:5000/api/health"
    echo ""
    wait_key
}

# Boucle principale
while true; do
    show_menu
    read -p "Choisissez une option [0-11]: " choice

    case $choice in
        1)
            clear
            ./start-dev.sh
            ;;
        2)
            clear
            ./stop-dev.sh
            wait_key
            ;;
        3)
            clear
            ./status-dev.sh
            wait_key
            ;;
        4)
            clear
            echo -e "${CYAN}📋 Logs${NC}"
            echo ""
            echo "  1. Backend"
            echo "  2. Frontend"
            echo "  3. Les deux"
            echo ""
            read -p "Choix [1-3]: " log_choice
            case $log_choice in
                1) ./logs-dev.sh backend ;;
                2) ./logs-dev.sh frontend ;;
                3) ./logs-dev.sh ;;
            esac
            ;;
        5)
            clear
            start_backend
            ;;
        6)
            clear
            start_frontend
            ;;
        7)
            clear
            echo -e "${YELLOW}🔄 Redémarrage...${NC}"
            ./stop-dev.sh
            sleep 2
            ./start-dev.sh
            ;;
        8)
            clear
            clean_env
            ;;
        9)
            clear
            reinstall_deps
            ;;
        10)
            clear
            open_urls
            ;;
        11)
            show_docs
            ;;
        0)
            clear
            echo -e "${GREEN}👋 Au revoir!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Option invalide${NC}"
            wait_key
            ;;
    esac
done

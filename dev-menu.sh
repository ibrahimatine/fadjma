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
    echo -e "  ${BLUE}12${NC}) 🐳 Docker Management"
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

# ============================================
# 🐳 DOCKER MANAGEMENT FUNCTIONS
# ============================================

# Fonction pour vérifier Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker n'est pas installé${NC}"
        echo -e "${YELLOW}Installation requise: https://docs.docker.com/get-docker/${NC}"
        return 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
        echo -e "${YELLOW}Installation requise: https://docs.docker.com/compose/install/${NC}"
        return 1
    fi

    if ! sudo docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon n'est pas démarré${NC}"
        echo -e "${YELLOW}Démarrez Docker Desktop ou le service Docker${NC}"
        return 1
    fi

    return 0
}

# Fonction pour vérifier le statut Docker
docker_status() {
    echo -e "${CYAN}📊 Statut Docker:${NC}"
    echo ""

    if sudo docker-compose ps 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}Services Docker actifs:${NC}"
        sudo docker-compose ps
    else
        echo -e "${YELLOW}Aucun service Docker actif${NC}"
    fi
    echo ""
}

# Fonction pour configurer .env si nécessaire
setup_docker_env() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  Fichier .env non trouvé${NC}"
        read -p "Copier .env.example vers .env ? [O/n]: " copy_env

        if [ "$copy_env" != "n" ] && [ "$copy_env" != "N" ]; then
            cp .env.example .env
            echo -e "${GREEN}✓ Fichier .env créé${NC}"
            echo -e "${YELLOW}⚠️  IMPORTANT: Éditez .env avec vos credentials Hedera${NC}"
            read -p "Voulez-vous éditer .env maintenant ? [O/n]: " edit_now

            if [ "$edit_now" != "n" ] && [ "$edit_now" != "N" ]; then
                ${EDITOR:-nano} .env
            fi
        else
            echo -e "${RED}❌ .env requis pour Docker${NC}"
            return 1
        fi
    fi
    return 0
}

# Fonction pour démarrer Docker
docker_start() {
    echo -e "${BLUE}🐳 Démarrage des services Docker...${NC}"
    echo ""

    if ! check_docker; then
        wait_key
        return 1
    fi

    if ! setup_docker_env; then
        wait_key
        return 1
    fi

    echo -e "${CYAN}Lancement sudo docker-compose up -d...${NC}"
    sudo docker-compose up -d

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Services Docker démarrés${NC}"
        echo ""
        sudo docker-compose ps
        echo ""
        echo -e "${YELLOW}Attendez ~40 secondes pour le health check du backend...${NC}"
        echo ""
        echo -e "${CYAN}URLs disponibles:${NC}"
        echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
        echo -e "  Backend:  ${GREEN}http://localhost:5000${NC}"
        echo -e "  Health:   ${GREEN}http://localhost:5000/api/health${NC}"
    else
        echo -e "${RED}❌ Erreur lors du démarrage Docker${NC}"
    fi

    wait_key
}

# Fonction pour arrêter Docker
docker_stop() {
    echo -e "${YELLOW}🛑 Arrêt des services Docker...${NC}"

    sudo docker-compose down

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Services Docker arrêtés${NC}"
    else
        echo -e "${RED}❌ Erreur lors de l'arrêt${NC}"
    fi

    wait_key
}

# Fonction pour les logs Docker
docker_logs() {
    clear
    echo -e "${CYAN}📋 Logs Docker${NC}"
    echo ""
    echo "  1. Backend"
    echo "  2. Frontend"
    echo "  3. Les deux (temps réel)"
    echo "  4. Retour"
    echo ""
    read -p "Choix [1-4]: " log_choice

    case $log_choice in
        1)
            clear
            echo -e "${CYAN}Logs Backend (Ctrl+C pour quitter):${NC}"
            sudo docker-compose logs -f backend
            ;;
        2)
            clear
            echo -e "${CYAN}Logs Frontend (Ctrl+C pour quitter):${NC}"
            sudo docker-compose logs -f frontend
            ;;
        3)
            clear
            echo -e "${CYAN}Logs Temps Réel (Ctrl+C pour quitter):${NC}"
            sudo docker-compose logs -f
            ;;
        4)
            return
            ;;
    esac
}

# Fonction pour initialiser la base de données
docker_init_db() {
    echo -e "${BLUE}🗄️  Initialisation de la base de données...${NC}"
    echo ""

    if ! sudo docker-compose ps | grep -q "backend.*Up"; then
        echo -e "${RED}❌ Le service backend doit être démarré${NC}"
        wait_key
        return 1
    fi

    echo -e "${CYAN}Étape 1/2: Initialisation SQLite...${NC}"
    sudo docker-compose exec backend npm run init:sqlite

    echo ""
    echo -e "${CYAN}Étape 2/2: Seed des données...${NC}"
    echo ""
    echo "  1. Seed complet (12 utilisateurs + dossiers)"
    echo "  2. Seed minimal (8 utilisateurs de base)"
    echo ""
    read -p "Choix [1-2]: " seed_choice

    case $seed_choice in
        1)
            sudo docker-compose exec backend npm run seed:full
            ;;
        2)
            sudo docker-compose exec backend npm run seed:clean
            ;;
    esac

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Base de données initialisée${NC}"
        echo ""
        echo -e "${CYAN}Comptes de test disponibles:${NC}"
        echo -e "  Médecin:    ${YELLOW}dr.martin@fadjma.com${NC}         / Demo2024!"
        echo -e "  Patient:    ${YELLOW}jean.dupont@demo.com${NC}         / Demo2024!"
        echo -e "  Pharmacien: ${YELLOW}pharmacie.centrale@fadjma.com${NC} / Demo2024!"
        echo -e "  Admin:      ${YELLOW}admin@fadjma.com${NC}             / Admin2024!"
    else
        echo -e "${RED}❌ Erreur lors de l'initialisation${NC}"
    fi

    wait_key
}

# Fonction pour rebuild les images
docker_rebuild() {
    echo -e "${YELLOW}🔨 Rebuild des images Docker...${NC}"
    echo ""
    echo -e "${RED}⚠️  Ceci va arrêter les services et reconstruire les images${NC}"
    read -p "Continuer ? [o/N]: " confirm

    if [ "$confirm" = "o" ] || [ "$confirm" = "O" ]; then
        echo ""
        echo -e "${CYAN}Arrêt des services...${NC}"
        sudo docker-compose down

        echo ""
        echo -e "${CYAN}Rebuild des images...${NC}"
        sudo docker-compose build --no-cache

        echo ""
        echo -e "${CYAN}Redémarrage des services...${NC}"
        sudo docker-compose up -d

        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✓ Images reconstruites et services redémarrés${NC}"
        else
            echo -e "${RED}❌ Erreur lors du rebuild${NC}"
        fi
    else
        echo -e "${YELLOW}Opération annulée${NC}"
    fi

    wait_key
}

# Fonction pour nettoyer Docker
docker_clean() {
    echo -e "${YELLOW}🧹 Nettoyage Docker${NC}"
    echo ""
    echo -e "${RED}⚠️  OPTIONS DE NETTOYAGE:${NC}"
    echo ""
    echo "  1. Arrêter les services (docker-compose down)"
    echo "  2. Arrêter + Supprimer volumes (⚠️  PERTE DONNÉES DB)"
    echo "  3. Arrêter + Supprimer volumes + images"
    echo "  4. Nettoyage complet Docker système (prune)"
    echo "  5. Annuler"
    echo ""
    read -p "Choix [1-5]: " clean_choice

    case $clean_choice in
        1)
            echo ""
            echo -e "${CYAN}Arrêt des services...${NC}"
            sudo docker-compose down
            echo -e "${GREEN}✓ Services arrêtés${NC}"
            ;;
        2)
            echo ""
            echo -e "${RED}⚠️  ATTENTION: Toutes les données de la base seront perdues!${NC}"
            read -p "Êtes-vous sûr ? Tapez 'yes' pour confirmer: " confirm
            if [ "$confirm" = "yes" ]; then
                echo -e "${CYAN}Suppression des services et volumes...${NC}"
                sudo docker-compose down -v
                echo -e "${GREEN}✓ Services et volumes supprimés${NC}"
            else
                echo -e "${YELLOW}Opération annulée${NC}"
            fi
            ;;
        3)
            echo ""
            echo -e "${RED}⚠️  Suppression volumes + images!${NC}"
            read -p "Êtes-vous sûr ? Tapez 'yes' pour confirmer: " confirm
            if [ "$confirm" = "yes" ]; then
                echo -e "${CYAN}Suppression complète...${NC}"
                sudo docker-compose down -v --rmi all
                echo -e "${GREEN}✓ Services, volumes et images supprimés${NC}"
            else
                echo -e "${YELLOW}Opération annulée${NC}"
            fi
            ;;
        4)
            echo ""
            echo -e "${CYAN}Nettoyage système Docker (containers, images, volumes non utilisés)...${NC}"
            sudo docker system prune -a --volumes
            echo -e "${GREEN}✓ Nettoyage système terminé${NC}"
            ;;
        5)
            echo -e "${YELLOW}Opération annulée${NC}"
            ;;
    esac

    wait_key
}

# Fonction pour accéder au shell des containers
docker_shell() {
    echo -e "${CYAN}🐚 Accès Shell${NC}"
    echo ""
    echo "  1. Backend shell (sh)"
    echo "  2. Frontend shell (sh)"
    echo "  3. Backend - SQLite CLI"
    echo "  4. Retour"
    echo ""
    read -p "Choix [1-4]: " shell_choice

    case $shell_choice in
        1)
            echo -e "${CYAN}Connexion au backend...${NC}"
            sudo docker-compose exec backend sh
            ;;
        2)
            echo -e "${CYAN}Connexion au frontend...${NC}"
            sudo docker-compose exec frontend sh
            ;;
        3)
            echo -e "${CYAN}SQLite CLI (tapez .quit pour quitter)...${NC}"
            sudo docker-compose exec backend sqlite3 /app/data/database.sqlite
            ;;
        4)
            return
            ;;
    esac

    wait_key
}

# Fonction Quick Start pour les juges
docker_quick_start() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     🎯 QUICK START - Ready in 3 minutes! 🚀         ║${NC}"
    echo -e "${CYAN}║     Perfect for Hedera Hackathon Judges             ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${YELLOW}This will automatically:${NC}"
    echo "  ✓ Check Docker prerequisites"
    echo "  ✓ Configure environment (.env)"
    echo "  ✓ Start Docker services"
    echo "  ✓ Initialize SQLite database"
    echo "  ✓ Load test data (12 users + medical records)"
    echo "  ✓ Open application in browser"
    echo ""
    echo -e "${GREEN}Total time: ~3 minutes${NC}"
    echo ""
    read -p "Press Enter to start, or 'q' to cancel: " confirm

    if [ "$confirm" = "q" ] || [ "$confirm" = "Q" ]; then
        return
    fi

    # Étape 1: Vérifications
    echo ""
    echo -e "${CYAN}[1/6] Checking Docker prerequisites...${NC}"
    if ! check_docker; then
        echo -e "${RED}❌ Docker prerequisites not met. Please install Docker first.${NC}"
        wait_key
        return 1
    fi
    echo -e "${GREEN}✓ Docker is ready!${NC}"
    sleep 1

    # Étape 2: Configuration .env
    echo ""
    echo -e "${CYAN}[2/6] Configuring environment...${NC}"
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Creating .env from .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✓ .env created!${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  IMPORTANT: Default Hedera Testnet credentials are configured.${NC}"
        echo -e "${YELLOW}   For production, edit .env with your own credentials.${NC}"
    else
        echo -e "${GREEN}✓ .env already exists${NC}"
    fi
    sleep 1

    # Étape 3: Démarrage Docker
    echo ""
    echo -e "${CYAN}[3/6] Starting Docker services...${NC}"
    sudo docker-compose up -d

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to start Docker services${NC}"
        wait_key
        return 1
    fi

    echo -e "${GREEN}✓ Docker services started!${NC}"
    echo ""
    sudo docker-compose ps
    echo ""
    echo -e "${YELLOW}Waiting 45 seconds for backend health check...${NC}"

    # Attente avec progression
    for i in {45..1}; do
        echo -ne "\rWaiting... ${i}s  "
        sleep 1
    done
    echo ""
    echo -e "${GREEN}✓ Services should be healthy now${NC}"
    sleep 1

    # Étape 4: Vérifier que le backend est up
    echo ""
    echo -e "${CYAN}[4/6] Verifying backend is ready...${NC}"
    if ! sudo docker-compose ps | grep -q "backend.*Up"; then
        echo -e "${RED}❌ Backend is not running${NC}"
        echo -e "${YELLOW}Check logs with: sudo docker-compose logs backend${NC}"
        wait_key
        return 1
    fi
    echo -e "${GREEN}✓ Backend is running!${NC}"
    sleep 1

    # Étape 5: Initialisation base de données
    echo ""
    echo -e "${CYAN}[5/6] Initializing database with test data...${NC}"

    echo -e "${BLUE}  → Creating SQLite tables...${NC}"
    sudo docker-compose exec -T backend npm run init:sqlite

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to initialize SQLite${NC}"
        wait_key
        return 1
    fi

    echo ""
    echo -e "${BLUE}  → Loading test data (12 users + medical records)...${NC}"
    sudo docker-compose exec -T backend npm run seed:full

    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to seed database${NC}"
        wait_key
        return 1
    fi

    echo -e "${GREEN}✓ Database ready with test data!${NC}"
    sleep 1

    # Étape 6: Affichage des informations finales
    echo ""
    echo -e "${CYAN}[6/6] All done! 🎉${NC}"
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           ✅ FADJMA IS READY FOR TESTING!             ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${GREEN}🌐 Application URLs:${NC}"
    echo -e "   Frontend:    ${YELLOW}http://localhost:3000${NC}"
    echo -e "   Backend API: ${YELLOW}http://localhost:5000/api${NC}"
    echo -e "   Health:      ${YELLOW}http://localhost:5000/api/health${NC}"
    echo ""

    echo -e "${GREEN}👤 Test Accounts (Password: Demo2024!):${NC}"
    echo -e "   Doctor:      ${YELLOW}dr.martin@fadjma.com${NC}"
    echo -e "   Patient:     ${YELLOW}jean.dupont@demo.com${NC}"
    echo -e "   Pharmacist:  ${YELLOW}pharmacie.centrale@fadjma.com${NC}"
    echo -e "   Admin:       ${YELLOW}admin@fadjma.com${NC} (Password: Admin2024!)"
    echo ""

    echo -e "${GREEN}⛓️  Hedera Blockchain Integration:${NC}"
    echo -e "   Network:     ${YELLOW}Testnet${NC}"
    echo -e "   Account:     ${YELLOW}0.0.6164695${NC} (EC25519)"
    echo -e "   Account:     ${YELLOW}0.0.6089195${NC} (ECDSA)"
    echo -e "   Topic:       ${YELLOW}0.0.6854064${NC}"
    echo -e "   Verify:      ${YELLOW}https://hashscan.io/testnet/topic/0.0.6854064${NC}"
    echo ""

    echo -e "${GREEN}📊 What's included:${NC}"
    echo "   ✓ 12 test users (doctors, patients, pharmacists)"
    echo "   ✓ 11 medical records with Hedera anchoring"
    echo "   ✓ 9 prescriptions with unique matricules"
    echo "   ✓ SQLite database fully configured"
    echo "   ✓ All Hedera transactions verified on Testnet"
    echo ""

    echo -e "${CYAN}🎬 Quick Demo Path:${NC}"
    echo "   1. Open http://localhost:3000"
    echo "   2. Login as doctor: dr.martin@fadjma.com / Demo2024!"
    echo "   3. View existing medical records"
    echo "   4. Create a new medical record → See Hedera anchoring"
    echo "   5. Verify integrity → Check on HashScan"
    echo ""

    # Proposer d'ouvrir le navigateur
    read -p "Open application in browser now? [Y/n]: " open_browser

    if [ "$open_browser" != "n" ] && [ "$open_browser" != "N" ]; then
        echo ""
        echo -e "${CYAN}Opening browser...${NC}"
        sleep 1

        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:3000 2>/dev/null &
            xdg-open https://hashscan.io/testnet/topic/0.0.6854064 2>/dev/null &
        elif command -v open &> /dev/null; then
            open http://localhost:3000 &
            open https://hashscan.io/testnet/topic/0.0.6854064 &
        fi

        echo -e "${GREEN}✓ Browser tabs opened!${NC}"
    fi

    echo ""
    echo -e "${YELLOW}📋 Useful commands:${NC}"
    echo "   View logs:     sudo docker-compose logs -f"
    echo "   Stop services: sudo docker-compose down"
    echo "   Restart:       sudo docker-compose restart"
    echo ""

    wait_key
}

# Menu Docker principal
docker_menu() {
    while true; do
        clear
        echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║          🐳 FADJMA Docker Management 🐳              ║${NC}"
        echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
        echo ""

        # Afficher le statut
        docker_status

        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${GREEN}🎯 FOR JUDGES / QUICK START:${NC}"
        echo ""
        echo -e "  ${GREEN}★${NC}) ${GREEN}🚀 QUICK START - Deploy Everything in 3 minutes!${NC}"
        echo ""
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${YELLOW}Manual Configuration (Advanced):${NC}"
        echo ""
        echo -e "  ${GREEN}1${NC}) 🚀 Start Docker services"
        echo -e "  ${GREEN}2${NC}) 🛑 Stop Docker services"
        echo -e "  ${GREEN}3${NC}) 🔄 Restart Docker"
        echo ""
        echo -e "  ${BLUE}4${NC}) 🗄️  Initialize database + Seed"
        echo -e "  ${BLUE}5${NC}) 🐚 Access Shell / SQLite CLI"
        echo ""
        echo -e "  ${MAGENTA}6${NC}) 📋 View logs"
        echo -e "  ${MAGENTA}7${NC}) 🔨 Rebuild images"
        echo -e "  ${MAGENTA}8${NC}) 🧹 Clean Docker"
        echo ""
        echo -e "  ${CYAN}9${NC}) 📊 Detailed status"
        echo -e "  ${CYAN}10${NC}) 📚 Docker guide"
        echo ""
        echo -e "  ${RED}0${NC}) ← Back to main menu"
        echo ""
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        read -p "Choose option [0-10, ★ for Quick Start]: " docker_choice

        case $docker_choice in
            "★"|"*"|"q"|"Q"|"quick"|"QUICK")
                docker_quick_start
                ;;
            1)
                clear
                docker_start
                ;;
            2)
                clear
                docker_stop
                ;;
            3)
                clear
                echo -e "${YELLOW}🔄 Redémarrage Docker...${NC}"
                docker-compose restart
                echo -e "${GREEN}✓ Services redémarrés${NC}"
                wait_key
                ;;
            4)
                clear
                docker_init_db
                ;;
            5)
                clear
                docker_shell
                ;;
            6)
                docker_logs
                ;;
            7)
                clear
                docker_rebuild
                ;;
            8)
                clear
                docker_clean
                ;;
            9)
                clear
                echo -e "${CYAN}📊 Statut Détaillé Docker${NC}"
                echo ""
                echo -e "${YELLOW}Services:${NC}"
                sudo docker-compose ps
                echo ""
                echo -e "${YELLOW}Images:${NC}"
                sudo docker images | grep fadjma
                echo ""
                echo -e "${YELLOW}Volumes:${NC}"
                sudo docker volume ls | grep fadjma
                echo ""
                echo -e "${YELLOW}Réseau:${NC}"
                sudo docker network ls | grep fadjma
                echo ""
                wait_key
                ;;
            10)
                clear
                echo -e "${CYAN}📚 Guide Docker FADJMA${NC}"
                echo ""
                echo -e "${YELLOW}Démarrage rapide (5 minutes):${NC}"
                echo ""
                echo "  1. Vérifier Docker installé et démarré"
                echo "  2. Copier .env.example vers .env"
                echo "  3. Éditer .env avec vos credentials Hedera"
                echo "  4. sudo docker-compose up -d"
                echo "  5. sudo docker-compose exec backend npm run init:sqlite"
                echo "  6. sudo docker-compose exec backend npm run seed:full"
                echo "  7. Accéder http://localhost:3000"
                echo ""
                echo -e "${YELLOW}Commandes utiles:${NC}"
                echo ""
                echo "  sudo docker-compose ps              # Voir les services"
                echo "  sudo docker-compose logs -f         # Logs temps réel"
                echo "  sudo docker-compose exec backend sh # Shell backend"
                echo "  sudo docker-compose down -v         # Tout supprimer"
                echo ""
                echo -e "${YELLOW}Documentation complète:${NC}"
                echo "  - DOCKER_QUICK_TEST.md"
                echo "  - docs/DOCKER_SETUP.md"
                echo "  - docs/DOCKER_SQLITE_MIGRATION_SUMMARY.md"
                echo ""
                wait_key
                ;;
            0)
                return
                ;;
            *)
                echo -e "${RED}Option invalide${NC}"
                wait_key
                ;;
        esac
    done
}

# ============================================
# MAIN MENU LOOP
# ============================================

# Boucle principale
while true; do
    show_menu
    read -p "Choisissez une option [0-12]: " choice

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
        12)
            clear
            docker_menu
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

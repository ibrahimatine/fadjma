#!/bin/bash

###############################################################################
# FADJMA - Docker Quick Start Script
# Hedera Africa Hackathon 2025
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}║              ${CYAN}FADJMA - Docker Quick Start${PURPLE}                 ║${NC}"
echo -e "${PURPLE}║          ${YELLOW}Hedera Africa Hackathon 2025${PURPLE}                   ║${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Docker is installed
echo -e "${BLUE}🔍 Vérification des prérequis...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé!${NC}"
    echo ""
    echo -e "${YELLOW}Installation:${NC}"
    echo "  Ubuntu/Debian: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    echo "  macOS:         brew install --cask docker"
    echo "  Windows:       https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo -e "${GREEN}✅ Docker installé ($(docker --version))${NC}"

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé!${NC}"
    echo ""
    echo -e "${YELLOW}Installation:${NC}"
    echo "  sudo apt-get install docker-compose-plugin"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose installé${NC}"


echo -e "${GREEN}✅ Docker daemon actif${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé${NC}"

    if [ -f .env.docker ]; then
        echo -e "${BLUE}📋 Copie de .env.docker vers .env...${NC}"
        cp .env.docker .env
        echo -e "${GREEN}✅ Fichier .env créé${NC}"
    else
        echo -e "${RED}❌ Fichier .env.docker non trouvé!${NC}"
        echo ""
        echo -e "${YELLOW}Veuillez créer un fichier .env avec les variables suivantes:${NC}"
        echo "  HEDERA_ECDSA_ACCOUNT_ID=0.0.XXXXXXX"
        echo "  HEDERA_ECDSA_PRIVATE_KEY=302e020100..."
        echo "  HEDERA_TOPIC_ID=0.0.6854064"
        echo "  HEDERA_NETWORK=testnet"
        exit 1
    fi

    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Modifiez le fichier .env avec vos credentials Hedera${NC}"
    echo -e "${YELLOW}Les credentials de test sont fournis dans la soumission DoraHacks${NC}"
    echo ""
    read -p "$(echo -e ${CYAN}Appuyez sur Entrée une fois le fichier .env configuré...${NC})"
fi

# Verify essential env variables
echo -e "${BLUE}🔍 Vérification de la configuration...${NC}"
source .env

if [ -z "$HEDERA_ECDSA_ACCOUNT_ID" ] || [ "$HEDERA_ECDSA_ACCOUNT_ID" == "0.0.XXXXXXX" ]; then
    echo -e "${RED}❌ HEDERA_ECDSA_ACCOUNT_ID non configuré dans .env${NC}"
    exit 1
fi

if [ -z "$HEDERA_ECDSA_PRIVATE_KEY" ] || [ "$HEDERA_ECDSA_PRIVATE_KEY" == "YOUR_PRIVATE_KEY_HERE" ]; then
    echo -e "${RED}❌ HEDERA_ECDSA_PRIVATE_KEY non configuré dans .env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration validée${NC}"
echo -e "${CYAN}   - Account ID: ${HEDERA_ECDSA_ACCOUNT_ID}${NC}"
echo -e "${CYAN}   - Topic ID:   ${HEDERA_TOPIC_ID}${NC}"
echo -e "${CYAN}   - Network:    ${HEDERA_NETWORK}${NC}"
echo ""

# Ask for confirmation
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Prêt à démarrer FADJMA avec Docker${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Services à démarrer:"
echo "    • Backend  (Node.js + Express + Hedera) → http://localhost:5000"
echo "    • Frontend (React + Nginx)              → http://localhost:3000"
echo ""
read -p "$(echo -e ${CYAN}Continuer? [Y/n]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
    echo -e "${YELLOW}❌ Annulé${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              🔨 BUILD & DÉMARRAGE                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Stop any running containers
echo -e "${YELLOW}🛑 Arrêt des conteneurs existants...${NC}"
docker compose down 2>/dev/null || true
echo -e "${GREEN}✅ Conteneurs arrêtés${NC}"
echo ""

# Build images
echo -e "${BLUE}🔨 Build des images Docker...${NC}"
echo -e "${CYAN}   (Cela peut prendre 2-5 minutes la première fois)${NC}"
echo ""

if docker compose build --no-cache; then
    echo ""
    echo -e "${GREEN}✅ Build réussi${NC}"
else
    echo ""
    echo -e "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi

echo ""

# Start services
echo -e "${BLUE}🚀 Démarrage des services...${NC}"
if docker compose up -d; then
    echo -e "${GREEN}✅ Services démarrés${NC}"
else
    echo -e "${RED}❌ Erreur lors du démarrage${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⏳ Attente que les services soient prêts...${NC}"

# Wait for backend to be healthy
MAX_WAIT=60
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend prêt${NC}"
        break
    fi
    echo -ne "${CYAN}   Backend: En cours de démarrage... ($COUNTER/$MAX_WAIT)${NC}\r"
    sleep 2
    COUNTER=$((COUNTER+2))
done

if [ $COUNTER -ge $MAX_WAIT ]; then
    echo ""
    echo -e "${RED}❌ Timeout: Backend n'a pas démarré${NC}"
    echo -e "${YELLOW}Vérifiez les logs: docker compose logs backend${NC}"
    exit 1
fi

echo ""

# Wait for frontend to be healthy
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend prêt${NC}"
        break
    fi
    echo -ne "${CYAN}   Frontend: En cours de démarrage... ($COUNTER/$MAX_WAIT)${NC}\r"
    sleep 2
    COUNTER=$((COUNTER+2))
done

if [ $COUNTER -ge $MAX_WAIT ]; then
    echo ""
    echo -e "${RED}❌ Timeout: Frontend n'a pas démarré${NC}"
    echo -e "${YELLOW}Vérifiez les logs: docker compose logs frontend${NC}"
    exit 1
fi

echo ""
echo ""

# Success banner
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║              ✅ FADJMA DÉMARRÉ AVEC SUCCÈS!                ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show running services
echo -e "${BLUE}📊 Services en cours d'exécution:${NC}"
echo ""
docker compose ps
echo ""

# Show access URLs
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🌐 Accès à l'application:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Frontend:${NC}    http://localhost:3000"
echo -e "  ${GREEN}Backend API:${NC} http://localhost:5000"
echo -e "  ${GREEN}Health API:${NC}  http://localhost:5000/api/health"
echo ""

# Show test accounts
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}👤 Comptes de test:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BLUE}Docteur:${NC}   doctor@fadjma.sn / password"
echo -e "  ${BLUE}Patient:${NC}   patient@fadjma.sn / password"
echo -e "  ${BLUE}Pharmacie:${NC} pharmacy@fadjma.sn / password"
echo -e "  ${BLUE}Admin:${NC}     admin@fadjma.sn / password"
echo ""

# Show useful commands
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}💡 Commandes utiles:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}Voir les logs:${NC}       docker compose logs -f"
echo -e "  ${GREEN}Arrêter:${NC}             docker compose down"
echo -e "  ${GREEN}Redémarrer:${NC}          docker compose restart"
echo -e "  ${GREEN}Rebuild:${NC}             docker compose up -d --build"
echo ""

# Show Hedera info
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}⛓️  Vérification Hedera:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}HashScan:${NC}    https://hashscan.io/testnet/topic/${HEDERA_TOPIC_ID}"
echo -e "  ${GREEN}Network:${NC}     ${HEDERA_NETWORK}"
echo -e "  ${GREEN}Account:${NC}     ${HEDERA_ECDSA_ACCOUNT_ID}"
echo ""

# Offer to open browser
read -p "$(echo -e ${CYAN}Ouvrir l'application dans le navigateur? [Y/n]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000 &
    elif command -v open &> /dev/null; then
        open http://localhost:3000 &
    else
        echo -e "${YELLOW}Ouvrez manuellement: http://localhost:3000${NC}"
    fi
fi

echo ""
echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║  ${CYAN}Profitez de votre expérience FADJMA! 🚀${PURPLE}                   ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

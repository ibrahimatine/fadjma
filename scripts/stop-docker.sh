#!/bin/bash

###############################################################################
# FADJMA - Docker Stop Script
# Hedera Africa Hackathon 2025
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║              FADJMA - Arrêt des Services                   ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Options d'arrêt:${NC}"
echo ""
echo "  1) Arrêter les services (garder les données)"
echo "  2) Arrêter et supprimer les conteneurs (garder les données)"
echo "  3) Tout supprimer (conteneurs + volumes + données) ⚠️"
echo "  4) Annuler"
echo ""

read -p "$(echo -e ${BLUE}Choisissez une option [1-4]:${NC} )" choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}🛑 Arrêt des services...${NC}"
        docker compose stop
        echo -e "${GREEN}✅ Services arrêtés${NC}"
        echo -e "${YELLOW}💡 Pour redémarrer: docker compose start${NC}"
        ;;
    2)
        echo ""
        echo -e "${BLUE}🛑 Arrêt et suppression des conteneurs...${NC}"
        docker compose down
        echo -e "${GREEN}✅ Conteneurs supprimés (données préservées)${NC}"
        echo -e "${YELLOW}💡 Pour redémarrer: ./start-docker.sh${NC}"
        ;;
    3)
        echo ""
        echo -e "${RED}⚠️  ATTENTION: Cette action supprimera TOUTES les données!${NC}"
        read -p "$(echo -e ${YELLOW}Êtes-vous sûr? [y/N]:${NC} )" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${BLUE}🗑️  Suppression complète...${NC}"
            docker compose down -v
            echo -e "${GREEN}✅ Tout supprimé${NC}"
        else
            echo -e "${YELLOW}❌ Annulé${NC}"
        fi
        ;;
    4)
        echo -e "${YELLOW}❌ Annulé${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Option invalide${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✨ Terminé!${NC}"

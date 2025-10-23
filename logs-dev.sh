#!/bin/bash

# 📋 FADJMA Development Logs Viewer
# Affiche les logs du backend et frontend en temps réel

# Couleurs
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKEND_LOG="logs/backend-dev.log"
FRONTEND_LOG="logs/frontend-dev.log"

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📋 FADJMA Development Logs${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier quel mode utiliser
if [ "$1" == "backend" ]; then
    echo -e "${BLUE}📋 Backend logs (Ctrl+C pour quitter):${NC}\n"
    tail -f "$BACKEND_LOG" 2>/dev/null || echo "Aucun log backend trouvé"
elif [ "$1" == "frontend" ]; then
    echo -e "${MAGENTA}📋 Frontend logs (Ctrl+C pour quitter):${NC}\n"
    tail -f "$FRONTEND_LOG" 2>/dev/null || echo "Aucun log frontend trouvé"
else
    # Afficher les deux logs en parallèle avec multitail si disponible
    if command -v multitail &> /dev/null; then
        multitail -s 2 -sn 1,${BLUE}Backend${NC} "$BACKEND_LOG" -sn 1,${MAGENTA}Frontend${NC} "$FRONTEND_LOG"
    else
        echo -e "${CYAN}💡 Tip: Installez 'multitail' pour voir les deux logs en parallèle${NC}"
        echo -e "${CYAN}    sudo apt install multitail${NC}\n"
        echo -e "Usage:"
        echo -e "  ${BLUE}./logs-dev.sh backend${NC}   # Logs backend uniquement"
        echo -e "  ${MAGENTA}./logs-dev.sh frontend${NC}  # Logs frontend uniquement"
        echo ""
        echo -e "${BLUE}📋 Backend logs:${NC}"
        tail -n 20 "$BACKEND_LOG" 2>/dev/null || echo "Aucun log backend trouvé"
        echo ""
        echo -e "${MAGENTA}📋 Frontend logs:${NC}"
        tail -n 20 "$FRONTEND_LOG" 2>/dev/null || echo "Aucun log frontend trouvé"
    fi
fi

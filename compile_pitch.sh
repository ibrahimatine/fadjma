#!/bin/bash

###############################################################################
# FADJMA Pitch Deck - Script de Compilation Automatique
# Hedera Africa Hackathon 2025
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Files
TEX_FILE="FADJMA_PITCH_DECK.tex"
PDF_FILE="FADJMA_PITCH_DECK.pdf"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  FADJMA Pitch Deck - Compilation LaTeX                    ║${NC}"
echo -e "${BLUE}║  Hedera Africa Hackathon 2025                              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if XeLaTeX is installed
if ! command -v xelatex &> /dev/null; then
    echo -e "${RED}❌ XeLaTeX n'est pas installé!${NC}"
    echo ""
    echo -e "${YELLOW}Installation:${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install texlive-xetex texlive-fonts-extra"
    echo "  macOS:         brew install --cask mactex"
    echo ""
    echo -e "${BLUE}Ou utilisez Overleaf (en ligne, recommandé):${NC}"
    echo "  https://www.overleaf.com/"
    exit 1
fi

# Check if .tex file exists
if [ ! -f "$TEX_FILE" ]; then
    echo -e "${RED}❌ Fichier $TEX_FILE introuvable!${NC}"
    exit 1
fi

echo -e "${YELLOW}📄 Fichier source: $TEX_FILE${NC}"
echo -e "${YELLOW}🎯 Fichier cible:  $PDF_FILE${NC}"
echo ""

# Remove old PDF if exists
if [ -f "$PDF_FILE" ]; then
    echo -e "${YELLOW}🗑️  Suppression de l'ancien PDF...${NC}"
    rm -f "$PDF_FILE"
fi

# First compilation pass
echo -e "${BLUE}🔨 Compilation (Pass 1/2)...${NC}"
if xelatex -interaction=nonstopmode "$TEX_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Pass 1 réussie${NC}"
else
    echo -e "${RED}❌ Erreur lors de la compilation (Pass 1)${NC}"
    echo -e "${YELLOW}Vérifiez le fichier de log: ${TEX_FILE%.tex}.log${NC}"
    exit 1
fi

# Second compilation pass (for references)
echo -e "${BLUE}🔨 Compilation (Pass 2/2)...${NC}"
if xelatex -interaction=nonstopmode "$TEX_FILE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Pass 2 réussie${NC}"
else
    echo -e "${RED}❌ Erreur lors de la compilation (Pass 2)${NC}"
    echo -e "${YELLOW}Vérifiez le fichier de log: ${TEX_FILE%.tex}.log${NC}"
    exit 1
fi

# Clean up auxiliary files
echo -e "${BLUE}🧹 Nettoyage des fichiers temporaires...${NC}"
rm -f *.aux *.log *.nav *.out *.snm *.toc *.vrb 2>/dev/null || true
echo -e "${GREEN}✅ Nettoyage terminé${NC}"

# Check if PDF was created
if [ -f "$PDF_FILE" ]; then
    FILE_SIZE=$(du -h "$PDF_FILE" | cut -f1)
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ SUCCÈS! PDF généré avec succès                         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📊 Informations:${NC}"
    echo -e "   Fichier: ${GREEN}$PDF_FILE${NC}"
    echo -e "   Taille:  ${GREEN}$FILE_SIZE${NC}"
    echo -e "   Chemin:  ${GREEN}$(pwd)/$PDF_FILE${NC}"
    echo ""
    echo -e "${BLUE}🎯 Prochaines étapes:${NC}"
    echo "   1. Vérifier le PDF:"
    echo "      → evince $PDF_FILE"
    echo "      → xdg-open $PDF_FILE"
    echo ""
    echo "   2. Mode présentation:"
    echo "      → evince $PDF_FILE --presentation"
    echo ""
    echo "   3. Soumettre sur DoraHacks ✅"
    echo ""
else
    echo -e "${RED}❌ Erreur: PDF non généré${NC}"
    exit 1
fi

# Optional: Open PDF automatically
read -p "$(echo -e ${YELLOW}Voulez-vous ouvrir le PDF maintenant? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v evince &> /dev/null; then
        evince "$PDF_FILE" &
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$PDF_FILE" &
    elif command -v open &> /dev/null; then
        open "$PDF_FILE" &
    else
        echo -e "${YELLOW}Ouvrez manuellement: $PDF_FILE${NC}"
    fi
fi

echo -e "${GREEN}✨ Terminé!${NC}"

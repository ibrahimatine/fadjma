# Guide de Compilation LaTeX - FADJMA Pitch Deck

## 📄 Fichier Créé
`FADJMA_PITCH_DECK.tex` - Présentation Beamer complète (12 slides)

---

## 🚀 COMPILATION RAPIDE (Méthode Recommandée)

### Option 1: Overleaf (En Ligne - PLUS SIMPLE)

**Avantages:**
- ✅ Aucune installation requise
- ✅ Compilation automatique
- ✅ Prévisualisation en temps réel
- ✅ Export PDF direct
- ✅ Gratuit

**Instructions:**

1. **Aller sur Overleaf:**
   - URL: https://www.overleaf.com/
   - Créer un compte gratuit (ou se connecter)

2. **Créer un nouveau projet:**
   - Cliquer "New Project" → "Blank Project"
   - Nom: "FADJMA Pitch Deck"

3. **Uploader le fichier:**
   - Cliquer sur "Upload" icon (en haut à gauche)
   - Sélectionner `FADJMA_PITCH_DECK.tex`
   - Le fichier apparaît dans le projet

4. **Configurer le compilateur:**
   - Cliquer "Menu" (en haut à gauche)
   - Sous "Settings":
     - Compiler: Sélectionner **"XeLaTeX"** (important!)
     - TeX Live version: 2024 (ou la plus récente)
   - Fermer le menu

5. **Compiler:**
   - Cliquer "Recompile" (bouton vert en haut)
   - Attendre 10-30 secondes
   - Le PDF s'affiche à droite

6. **Télécharger le PDF:**
   - Cliquer "Download PDF" (en haut de la prévisualisation)
   - Fichier: `FADJMA_PITCH_DECK.pdf`

**✅ C'EST FAIT! Vous avez votre PDF professionnel.**

---

### Option 2: Compilation Locale (Si vous avez Linux/Mac)

#### A. Installation LaTeX

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install texlive-full texlive-xetex texlive-fonts-extra
```

**macOS (avec Homebrew):**
```bash
brew install --cask mactex
# Ou version plus légère:
brew install --cask basictex
```

**Vérification:**
```bash
xelatex --version
# Doit afficher: XeTeX 3.14... ou supérieur
```

---

#### B. Compilation

**Commande Simple:**
```bash
cd /home/cheikhmodiouf/fadjma
xelatex FADJMA_PITCH_DECK.tex
```

**Commande Complète (pour résoudre références):**
```bash
cd /home/cheikhmodiouf/fadjma
xelatex FADJMA_PITCH_DECK.tex
xelatex FADJMA_PITCH_DECK.tex  # 2ème passe pour les références
```

**Résultat:**
- Fichier généré: `FADJMA_PITCH_DECK.pdf`
- Emplacement: `/home/cheikhmodiouf/fadjma/FADJMA_PITCH_DECK.pdf`

---

#### C. Nettoyage des fichiers temporaires

```bash
rm -f *.aux *.log *.nav *.out *.snm *.toc *.vrb
```

Ou créer un script de compilation:

```bash
cat > compile_pitch.sh << 'EOF'
#!/bin/bash
echo "Compilation du Pitch Deck FADJMA..."
xelatex FADJMA_PITCH_DECK.tex
xelatex FADJMA_PITCH_DECK.tex
rm -f *.aux *.log *.nav *.out *.snm *.toc *.vrb
echo "✅ PDF généré: FADJMA_PITCH_DECK.pdf"
EOF

chmod +x compile_pitch.sh
./compile_pitch.sh
```

---

### Option 3: Windows

**Installation:**
1. Télécharger MiKTeX: https://miktex.org/download
2. Installer (accepter installation à la demande des packages)
3. Ouvrir "Command Prompt" ou "PowerShell"

**Compilation:**
```cmd
cd C:\Users\[YourName]\fadjma
xelatex FADJMA_PITCH_DECK.tex
```

**Alternative: Utiliser TeXworks (GUI):**
- Livré avec MiKTeX
- Ouvrir `FADJMA_PITCH_DECK.tex`
- Sélectionner "XeLaTeX" dans le menu déroulant
- Cliquer "Typeset" (bouton vert)

---

## 🎨 PERSONNALISATION DU DESIGN

### Modifier les Couleurs

Trouver ces lignes dans le fichier `.tex` (lignes 22-27):

```latex
\definecolor{HederaPurple}{HTML}{9333EA}
\definecolor{FadjmaBlue}{HTML}{4F46E5}
\definecolor{SuccessGreen}{HTML}{10B981}
\definecolor{WarningOrange}{HTML}{F59E0B}
\definecolor{DangerRed}{HTML}{EF4444}
```

Modifier les codes couleur hex selon vos préférences.

---

### Changer le Thème Beamer

Ligne 17:
```latex
\usetheme{Madrid}
```

Autres thèmes disponibles:
- `\usetheme{Copenhagen}` - Élégant et minimaliste
- `\usetheme{Berlin}` - Professionnel avec sidebar
- `\usetheme{Boadilla}` - Simple et clair
- `\usetheme{Singapore}` - Très minimaliste

**Test:** Changez le thème, recompilez, et choisissez votre préféré!

---

### Ajouter Votre Logo

1. **Préparer le logo:**
   - Format: PNG ou PDF (transparent recommandé)
   - Taille: 200x200 px minimum
   - Nom: `fadjma-logo.png`
   - Placer dans le même dossier que le `.tex`

2. **Modifier le fichier `.tex`:**

Ajouter après la ligne 11 (`\usepackage{hyperref}`):
```latex
\logo{\includegraphics[height=1cm]{fadjma-logo.png}}
```

Ou sur la page de titre (slide 1), remplacer le texte par:
```latex
\begin{center}
  \includegraphics[width=4cm]{fadjma-logo.png}

  \vspace{0.5cm}

  \Large{\textbf{Fully Auditable Digital Journal...}}
\end{center}
```

---

### Ajouter des Images/Graphiques

**Dans le texte:**
```latex
\begin{figure}
  \centering
  \includegraphics[width=0.8\textwidth]{nom-image.png}
  \caption{Description de l'image}
\end{figure}
```

**Exemple pour Slide 2 (The Problem):**
```latex
\begin{column}{0.5\textwidth}
  \includegraphics[width=\textwidth]{counterfeit-drugs.jpg}

  \textbf{30\% of prescriptions are counterfeit}
\end{column}
```

---

## 🔧 RÉSOLUTION DE PROBLÈMES

### Erreur: "Package fontawesome5 not found"

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install texlive-fonts-extra

# macOS
tlmgr install fontawesome5

# Ou commenter les lignes avec \faXXX dans le .tex
```

---

### Erreur: "XeLaTeX not found"

**Solution:**
- Vous utilisez pdflatex au lieu de xelatex
- Changez la commande de compilation:
  - Overleaf: Menu → Compiler → XeLaTeX
  - Ligne de commande: Utilisez `xelatex` au lieu de `pdflatex`

---

### Les couleurs ne s'affichent pas

**Solution:**
Vérifier que cette ligne est présente (ligne 1):
```latex
\documentclass[aspectratio=169,xcolor=dvipsnames]{beamer}
```

L'option `xcolor=dvipsnames` est nécessaire.

---

### QR Code ne fonctionne pas

**Solution:**
Commentez la ligne `\usepackage{qrcode}` (ligne 11) si pas nécessaire.

Ou installez le package:
```bash
sudo apt-get install texlive-latex-extra
```

---

## 📊 CONTENU DU PITCH DECK

### 12 Slides Créées:

1. **Title & Vision** - Introduction FADJMA
2. **The Problem** - Statistiques prescription fraud + data chaos
3. **The Solution** - Enriched Anchoring v2.0 innovation
4. **Why Hedera (MANDATORY)** - ABFT, fees, governance, ESG, throughput
5. **Market & Opportunity** - TAM/SAM/SOM avec chiffres
6. **Business & Revenue Model** - Multi-sided platform, projections
7. **Tokenomics & Community** - HEALTH token + community strategy
8. **Traction & Milestones** - 500+ tx, 50 users, performance metrics
9. **Team & Expertise** - Rôles, qualifications, Hedera certified
10. **Roadmap & The Ask** - 6 months plan, funding ask
11. **Product & Architecture** - Diagramme système complet
12. **Technology Readiness Level** - TRL 6 justifié

**✅ TOUS les slides MANDATORY sont inclus et détaillés**

---

## ✅ CHECKLIST PRÉ-SOUMISSION

### Contenu
- [x] 12 slides conformes au guide officiel
- [x] Slide 4 "Why Hedera" avec ABFT, governance, ESG
- [x] Slide 5 TAM/SAM/SOM chiffré
- [x] Slide 7 Tokenomics détaillé
- [x] Slide 11-12 Architecture + TRL level
- [ ] Vérifier les noms des team members (à personnaliser)
- [ ] Ajouter photos équipe si disponibles
- [ ] Vérifier tous les chiffres (dates, montants)

### Design
- [x] Couleurs Hedera/FADJMA appliquées
- [x] Thème professionnel (Madrid)
- [x] Tableaux et graphiques
- [x] Footer avec numérotation
- [ ] Logo FADJMA (à ajouter si disponible)
- [ ] Screenshots application (optionnel mais recommandé)

### Format
- [ ] Compiler en PDF
- [ ] Vérifier taille < 20MB
- [ ] Test sur différents devices (laptop, tablet)
- [ ] Liens cliquables fonctionnels
- [ ] Orientation paysage 16:9 ✓

---

## 🎯 AMÉLIORATIONS OPTIONNELLES

### 1. Ajouter des Animations

Entre slides, ajouter:
```latex
\begin{frame}
  \frametitle{Titre}

  \begin{itemize}[<+->]  % Apparition progressive
    \item Point 1
    \item Point 2
    \item Point 3
  \end{itemize}
\end{frame}
```

---

### 2. Créer des Blocks Colorés

```latex
\begin{alertblock}{Attention!}
  Message important en rouge
\end{alertblock}

\begin{exampleblock}{Exemple}
  Exemple en vert
\end{exampleblock}

\begin{block}{Information}
  Information standard
\end{block}
```

---

### 3. Graphiques avec TikZ

Le fichier inclut déjà des graphiques TikZ (Slide 11 - Architecture).

Pour ajouter d'autres graphiques:
```latex
\begin{tikzpicture}
  \pie[text=legend]{
    40/Patient Rewards,
    20/Team,
    15/Ecosystem,
    10/Liquidity,
    10/Treasury,
    5/Early Supporters
  }
\end{tikzpicture}
```

(Nécessite `\usepackage{pgf-pie}`)

---

## 📱 EXPORT VERS POWERPOINT

Si vous devez éditer dans PowerPoint après:

**Méthode 1: PDF → PPTX (Online)**
- https://www.pdf2go.com/pdf-to-powerpoint
- Upload le PDF généré
- Télécharger PPTX

**Méthode 2: Adobe Acrobat**
- Ouvrir PDF dans Acrobat Pro
- Fichier → Exporter vers → PowerPoint

**⚠️ Note:** La conversion PDF → PPTX n'est jamais parfaite. Utilisez uniquement si nécessaire.

---

## 🚀 WORKFLOW RECOMMANDÉ

### Pour le Hackathon:

**Jour 1 (Aujourd'hui):**
1. ✅ Upload sur Overleaf
2. ✅ Compiler pour tester
3. ✅ Vérifier que tout fonctionne
4. 🔄 Personnaliser les noms des team members
5. 🔄 Ajouter logo si disponible

**Jour 2:**
1. Ajouter screenshots de l'application
2. Remplacer placeholders `[Team Member X]` par vrais noms
3. Ajouter photos équipe (optionnel)
4. Review contenu avec l'équipe

**Jour 3:**
1. Corrections finales
2. Export PDF final
3. Test présentation (timing)
4. Backup en cloud

**✅ PRÊT POUR SOUMISSION**

---

## 💡 TIPS DE PRÉSENTATION

### Timing
- 12 slides × 2-3 min = 24-36 min (trop long pour pitch 5 min)
- **Solution:** Ce deck est pour SOUMISSION (PDF complet)
- Pour PITCH LIVE (5 min): Utilisez slides 1, 2, 3, 4, 5, 8, 10 seulement

### Mode Présentation
```bash
# Plein écran avec Evince (Linux)
evince FADJMA_PITCH_DECK.pdf --presentation

# macOS avec Preview
open -a Preview FADJMA_PITCH_DECK.pdf
# Puis: View → Enter Presentation Mode

# Windows avec Adobe Reader
# Ctrl+L pour plein écran
```

---

## 📞 SUPPORT

### Si la Compilation Échoue:

1. **Vérifier les packages manquants:**
   ```bash
   grep "! LaTeX Error" *.log
   ```

2. **Installer packages manquants:**
   ```bash
   sudo tlmgr install [nom-package]
   ```

3. **Utiliser Overleaf (solution de secours):**
   - Overleaf a TOUS les packages pré-installés
   - Pas de problème de dépendances

---

### Ressources Utiles:

- **Beamer User Guide:** https://ctan.org/pkg/beamer
- **Overleaf Tutorials:** https://www.overleaf.com/learn
- **LaTeX Stack Exchange:** https://tex.stackexchange.com/
- **TikZ Examples:** https://texample.net/tikz/

---

## ✨ RÉSUMÉ

**Fichier créé:** `FADJMA_PITCH_DECK.tex` ✅
**Slides:** 12 (conformes au guide officiel) ✅
**Thème:** Professionnel (Madrid + couleurs Hedera) ✅
**Contenu:** Complet avec tous slides MANDATORY ✅

**Méthode recommandée:**
1. **Overleaf** (le plus simple, en ligne)
2. Compilation locale (si LaTeX déjà installé)

**Temps estimé:** 5-10 minutes pour générer le PDF

---

**Prêt à compiler votre pitch deck professionnel! 🚀**

*Guide créé le 22 Octobre 2025 pour le Hedera Africa Hackathon*

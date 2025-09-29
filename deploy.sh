#!/bin/bash

# FADJMA Deployment Script
# This script prepares your project for deployment

set -e  # Exit on any error

echo "🚀 FADJMA Deployment Preparation Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists node; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command_exists npm; then
    print_error "npm is not installed"
    exit 1
fi

if ! command_exists git; then
    print_error "Git is not installed"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the FADJMA project root directory"
    exit 1
fi

# Backend preparation
print_status "Preparing backend..."
cd backend

if [ ! -f "package.json" ]; then
    print_error "Backend package.json not found"
    exit 1
fi

print_status "Installing backend dependencies..."
npm install

print_status "Running backend tests..."
if npm test; then
    print_success "Backend tests passed"
else
    print_warning "Some backend tests failed - continuing anyway"
fi

# Check environment variables
if [ ! -f ".env" ]; then
    if [ -f "../.env.example" ]; then
        print_warning "No .env file found. Copy .env.example and configure it:"
        print_status "cp ../.env.example .env"
    else
        print_error "No environment configuration found"
        exit 1
    fi
fi

# Test database initialization
print_status "Testing database setup..."
if [ -f "scripts/init-sqlite.js" ]; then
    node scripts/init-sqlite.js
    print_success "Database initialization successful"
else
    print_warning "Database initialization script not found"
fi

cd ..

# Frontend preparation
print_status "Preparing frontend..."
cd frontend

if [ ! -f "package.json" ]; then
    print_error "Frontend package.json not found"
    exit 1
fi

print_status "Installing frontend dependencies..."
npm install

print_status "Testing frontend build..."
if npm run build; then
    print_success "Frontend build successful"
    rm -rf build  # Clean up test build
else
    print_error "Frontend build failed"
    exit 1
fi

cd ..

# Git preparation
print_status "Checking git status..."
if [ -d ".git" ]; then
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes. Consider committing them before deployment."
        git status --short
    else
        print_success "Working directory is clean"
    fi

    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    print_status "Current branch: $CURRENT_BRANCH"

    # Check if we're up to date with remote
    if git ls-remote --exit-code origin >/dev/null 2>&1; then
        git fetch
        if [ $(git rev-list HEAD...origin/$CURRENT_BRANCH --count) != 0 ]; then
            print_warning "Your branch is not up to date with remote"
        else
            print_success "Branch is up to date with remote"
        fi
    else
        print_warning "Could not check remote status"
    fi
else
    print_warning "Not a git repository"
fi

# Platform-specific deployment instructions
print_status "Deployment options:"
echo ""
echo "1. VERCEL + RAILWAY (Recommended)"
echo "   • Frontend: vercel.json is configured"
echo "   • Backend: railway.toml is configured"
echo "   • Commands:"
echo "     - Push to GitHub"
echo "     - Connect Vercel to your repo"
echo "     - Connect Railway to your repo"
echo ""
echo "2. NETLIFY + RENDER"
echo "   • Frontend: netlify.toml is configured"
echo "   • Backend: render.yaml is configured"
echo "   • Commands:"
echo "     - Push to GitHub"
echo "     - Connect Netlify to your repo"
echo "     - Connect Render to your repo"
echo ""
echo "3. GITHUB PAGES (Frontend only)"
echo "   • Static hosting"
echo "   • Need separate backend hosting"
echo ""

# Environment variables checklist
print_status "Environment variables checklist for production:"
echo ""
echo "Backend (Railway/Render):"
echo "✓ NODE_ENV=production"
echo "✓ PORT=(auto-generated)"
echo "✓ JWT_SECRET=(generate secure)"
echo "✓ HEDERA_ACCOUNT_ID=(your account)"
echo "✓ HEDERA_PRIVATE_KEY=(your key)"
echo "✓ HEDERA_TOPIC_ID=(your topic)"
echo "✓ FRONTEND_URL=(your frontend URL)"
echo ""
echo "Frontend (Vercel/Netlify):"
echo "✓ REACT_APP_API_URL=(your backend URL)"
echo "✓ REACT_APP_ENVIRONMENT=production"
echo ""

# Final checklist
print_status "Pre-deployment checklist:"
echo "□ Environment variables configured"
echo "□ Hedera account has sufficient balance"
echo "□ Frontend and backend tests pass"
echo "□ Git repository is clean and pushed"
echo "□ Domain names decided (if using custom domains)"
echo "□ SSL certificates will be auto-generated"
echo ""

print_success "Deployment preparation completed!"
print_status "You can now deploy to your chosen platform(s)."
print_status "See DEPLOYMENT.md for detailed instructions."

echo ""
print_status "Quick deployment commands:"
echo "git add ."
echo "git commit -m 'Prepare for deployment'"
echo "git push origin main"
echo ""
echo "Then visit your hosting platform and connect the repository."
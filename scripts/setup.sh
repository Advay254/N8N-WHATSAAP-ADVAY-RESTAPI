#!/bin/bash

# Baileys API Setup Script

echo "🚀 Setting up Baileys WhatsApp API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if yarn is installed, if not use npm
if command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
    echo "✅ Using Yarn package manager"
else
    PACKAGE_MANAGER="npm"
    echo "✅ Using NPM package manager"
fi

# Install dependencies
echo "📦 Installing dependencies..."
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    yarn install
else
    npm install
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting the server"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p temp
mkdir -p auth_sessions

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
if [ "$PACKAGE_MANAGER" = "yarn" ]; then
    yarn db:generate
else
    npx prisma generate
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your PostgreSQL database in .env"
echo "2. Run database migrations: $PACKAGE_MANAGER migrate"
echo "3. Start the development server: $PACKAGE_MANAGER dev"
echo ""
echo "The API will be available at: http://localhost:3001"
echo "Dashboard: http://localhost:3001/dashboard"
echo "API Docs: http://localhost:3001/api-docs"

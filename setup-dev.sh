#!/bin/bash

# Setup development environment for Hakari Discord Bot

echo "Setting up development environment for Hakari Discord Bot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create logs directory
echo "Creating logs directory..."
mkdir -p logs

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your configuration before running the bot."
else
    echo ".env file already exists. Skipping creation."
fi

# Install nodemon for development
echo "Installing nodemon for development..."
npm install --save-dev nodemon

echo "Setup complete!"
echo "To start the bot in development mode, run: npm run dev"
echo "To run tests, run: npm test"
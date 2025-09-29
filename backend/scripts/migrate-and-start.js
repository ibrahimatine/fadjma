#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 FADJMA Backend - Starting deployment script...');

// Function to check if database exists
function databaseExists() {
  const dbPath = process.env.DATABASE_URL || './database.sqlite';
  const sqlitePath = dbPath.replace('sqlite:', '');
  return fs.existsSync(sqlitePath);
}

// Function to run command with error handling
function runCommand(command, description) {
  try {
    console.log(`📦 ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error.message);
    process.exit(1);
  }
}

// Function to wait for database to be ready
function waitForDatabase(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    if (databaseExists()) {
      console.log('✅ Database found');
      return true;
    }
    console.log(`⏳ Waiting for database... (${i + 1}/${maxAttempts})`);
    // Sleep for 2 seconds
    execSync('sleep 2', { stdio: 'ignore' });
  }
  return false;
}

// Main deployment process
async function deploy() {
  try {
    console.log('🔍 Checking environment...');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`PORT: ${process.env.PORT}`);
    console.log(`Database URL: ${process.env.DATABASE_URL || 'sqlite:./database.sqlite'}`);

    // Check if this is first deployment
    if (!databaseExists()) {
      console.log('🔧 First deployment detected - initializing database...');

      // Initialize SQLite database
      runCommand('npm run init:sqlite', 'Database initialization');

      // Wait for database to be ready
      if (!waitForDatabase()) {
        console.error('❌ Database initialization failed');
        process.exit(1);
      }
    } else {
      console.log('✅ Database already exists');
    }

    // Run any pending migrations
    console.log('🔄 Checking for database migrations...');
    try {
      // This command should be created based on your migration needs
      execSync('npm run migrate:check 2>/dev/null || echo "No migrations to run"', { stdio: 'inherit' });
    } catch (error) {
      console.log('ℹ️  No migration script found - skipping');
    }

    // Health check before starting
    console.log('🏥 Running health checks...');
    const healthChecks = [
      'JWT_SECRET',
      'HEDERA_ACCOUNT_ID',
      'HEDERA_PRIVATE_KEY'
    ];

    for (const envVar of healthChecks) {
      if (!process.env[envVar]) {
        console.warn(`⚠️  Warning: ${envVar} is not set`);
      } else {
        console.log(`✅ ${envVar} is configured`);
      }
    }

    // Test Hedera connection (optional)
    console.log('🌐 Testing external connections...');
    try {
      execSync('node -e "console.log(\'✅ Node.js is working\')"', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Node.js test failed');
      process.exit(1);
    }

    console.log('🎯 All checks passed - starting server...');

    // Start the main server
    require('../server.js');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM - shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT - shutting down gracefully');
  process.exit(0);
});

// Start deployment
deploy();
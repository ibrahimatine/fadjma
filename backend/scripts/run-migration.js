require('dotenv').config();
const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql')).sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log(`🔄 Executing migration: ${file}`);
      await sequelize.query(migrationSQL);
      console.log(`✅ Migration ${file} executed successfully.`);
    }
    console.log('✅ Migration executed successfully.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();
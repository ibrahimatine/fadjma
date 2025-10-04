const { Sequelize } = require('sequelize');
const path = require('path');

// Support both PostgreSQL (production) and SQLite (development)
const isDevelopment = process.env.NODE_ENV === 'development';
const usePostgres = process.env.USE_POSTGRES === 'true' || process.env.DATABASE_URL;

let sequelize;

if (usePostgres) {
  // PostgreSQL configuration for production
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl) {
    // Parse connection URL (Railway, Render, etc.)
    sequelize = new Sequelize(dbUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000
      }
    });
  } else {
    // Manual PostgreSQL configuration
    sequelize = new Sequelize(
      process.env.DB_NAME || 'fadjma_db',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 20,
          min: 5,
          acquire: 60000,
          idle: 10000
        }
      }
    );
  }

  console.log('📊 Using PostgreSQL database');
} else {
  // SQLite for development only
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

  console.log('📊 Using SQLite database (development mode)');

  if (!isDevelopment) {
    console.warn('⚠️  WARNING: SQLite is not recommended for production. Set USE_POSTGRES=true or DATABASE_URL');
  }
}

module.exports = { sequelize };

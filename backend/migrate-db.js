const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Starting database migration...');

const migrations = [
  `ALTER TABLE BaseUsers ADD COLUMN patientIdentifier VARCHAR(255) UNIQUE`,
  `ALTER TABLE BaseUsers ADD COLUMN isUnclaimed TINYINT(1) DEFAULT 0`,
  `ALTER TABLE BaseUsers ADD COLUMN createdByDoctorId UUID`,
  `ALTER TABLE BaseUsers ADD COLUMN dateOfBirth DATE`,
  `ALTER TABLE BaseUsers ADD COLUMN gender VARCHAR(255)`,
  `ALTER TABLE BaseUsers ADD COLUMN emergencyContactName VARCHAR(255)`,
  `ALTER TABLE BaseUsers ADD COLUMN emergencyContactPhone VARCHAR(255)`,
  `ALTER TABLE BaseUsers ADD COLUMN socialSecurityNumber VARCHAR(255)`
];

let completed = 0;
let failed = 0;

db.serialize(() => {
  migrations.forEach((sql, index) => {
    db.run(sql, function(err) {
      if (err) {
        // Ignore "duplicate column name" errors
        if (err.message.includes('duplicate column name')) {
          console.log(`⚠️  Column already exists: ${sql.split('ADD COLUMN ')[1]?.split(' ')[0]}`);
          completed++;
        } else {
          console.error(`❌ Error: ${err.message}`);
          failed++;
        }
      } else {
        console.log(`✅ Migration ${index + 1}/${migrations.length} completed`);
        completed++;
      }

      // Close DB when all migrations are processed
      if (completed + failed === migrations.length) {
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err.message);
          } else {
            console.log('\n✅ Database migration completed!');
            console.log(`   Successful: ${completed}/${migrations.length}`);
            if (failed > 0) {
              console.log(`   Failed: ${failed}/${migrations.length}`);
            }
          }
        });
      }
    });
  });
});

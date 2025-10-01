const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Adding patientIdentifier column...');

db.run('ALTER TABLE BaseUsers ADD COLUMN patientIdentifier VARCHAR(255)', (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('✅ patientIdentifier column already exists');
    } else {
      console.error('❌ Error:', err.message);
    }
  } else {
    console.log('✅ patientIdentifier column added successfully');
  }

  db.close();
});

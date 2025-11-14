const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'poker_user',
    password: 'poker_dev_password',
    database: 'poker_platform',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'reset-db.sql'),
      'utf8'
    );

    console.log('Executing reset script...');
    await client.query(sql);

    console.log('Database reset successfully!');
  } catch (error) {
    console.error('Error resetting database:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();

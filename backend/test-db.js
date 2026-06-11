const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  console.log('Connecting to database...');
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: 3306
    });

    console.log('Successfully connected to the database!');
    const [rows] = await connection.query('SHOW TABLES;');
    console.log('Existing tables in database:');
    console.log(rows);
    await connection.end();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

testConnection();

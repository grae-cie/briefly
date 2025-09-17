import Database from "better-sqlite3";

// This creates a file called database.sqlite in your backend folder
const db = new Database("database.sqlite");


// Create users table if it doesn’t exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  )
`);


export default db;

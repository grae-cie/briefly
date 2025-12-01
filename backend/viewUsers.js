import db from "./db.js"; 

const users = db.prepare("SELECT * FROM users").all();
console.log("All users:", users);

import sqlite3 from "sqlite3";
import { open } from "sqlite";

// fungsi untuk init database
export async function initDB() {
  const db = await open({
    filename: "./database.db", // file database akan dibuat otomatis
    driver: sqlite3.Database
  });

  // buat tabel users & chats
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      message TEXT,
      reply TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: 5432,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 0,
});


export async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    console.log("Connected to the database!");
    client.release();
  } catch (error) {
    console.error("Failed to connect to the database:", error);
  }
}

export function end() {
  console.log("ENDING");
}

export function query(text, params, callback) {
  return pool.query(text, params, callback);
}

import "dotenv/config";
import { Client } from "pg";

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log("Connected successfully!");
  const res = await client.query("SELECT NOW()");
  console.log("Result:", res.rows[0]);
  await client.end();
}

main().catch(console.error);

import mariadb from "mariadb";

async function test() {
  console.log("Testing MariaDB direct connection...");
  let conn;
  try {
    conn = await mariadb.createConnection({
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "mysqldb",
      database: "lms_db",
      allowPublicKeyRetrieval: true
    });
    console.log("SUCCESS! Connected successfully.");
    const rows = await conn.query("SELECT DATABASE()");
    console.log("Current Database:", rows);
  } catch (err) {
    console.error("CONNECTION FAILED:", err);
  } finally {
    if (conn) await conn.end();
  }
}

test();

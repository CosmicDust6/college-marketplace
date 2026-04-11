const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,

  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

// Test connection once
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB Connected");
    conn.release();
  } catch (err) {
    console.error("❌ DB Error:", err);
  }
})();

module.exports = pool;
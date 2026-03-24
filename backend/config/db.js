const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 🔥 Test connection immediately
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ DB Pool Connected");
    conn.release();
  } catch (err) {
    console.error("❌ DB Pool Error:", err);
  }
})();

module.exports = pool;
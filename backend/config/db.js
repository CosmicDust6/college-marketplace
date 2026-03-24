const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,      // 🔥 important
  keepAliveInitialDelay: 0
});

// 🔥 Auto reconnect wrapper
async function query(sql, params) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error("❌ DB ERROR:", err);

    // retry once if connection lost
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("🔄 Retrying DB query...");
      const [rows] = await pool.query(sql, params);
      return rows;
    }

    throw err;
  }
}

module.exports = {
  query
};
const mongoose = require("mongoose");
require("dotenv").config();

mongoose.set("bufferCommands", false);

let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = {
    feedback: {
      conn: null,
      promise: null,
    },
    nicetech: {
      conn: null,
    },
  };
}

// ======================================================
// Feedback Database
// ======================================================

async function connectDB() {
  if (cached.feedback.conn) return cached.feedback.conn;

  if (!cached.feedback.promise) {
    cached.feedback.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        dbName: "feedback_system",
      })
      .then((m) => {
        console.log("✅ Connected to Feedback Database");
        return m;
      });
  }

  try {
    cached.feedback.conn = await cached.feedback.promise;
  } catch (err) {
    cached.feedback.promise = null;
    console.error("Feedback DB connection failed:", err.message);
    throw err;
  }

  return cached.feedback.conn;
}

// ======================================================
// NICETECH Database
// ======================================================

function createNicetechConnection() {
  if (cached.nicetech.conn) return cached.nicetech.conn;

  const conn = mongoose.createConnection(process.env.MONGODB_URI, {
    dbName: "NICETECH",
  });

  conn.on("connected", () => {
    console.log("✅ Connected to NICETECH Database");
  });

  conn.on("error", (err) => {
    console.error("NICETECH Error:", err.message);
  });

  cached.nicetech.conn = conn;

  return conn;
}

const nicetechDB = createNicetechConnection();

module.exports = {
  connectDB,
  nicetechDB,
};
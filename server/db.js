import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Global cache for both connections
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = {
    feedback: { conn: null, promise: null },
    nicetech: { conn: null },
  };
}

// ---------- connectDB (feedback_system) ----------
async function connectDB() {
  if (cached.feedback.conn) return cached.feedback.conn;

  if (!cached.feedback.promise) {
    mongoose.set("bufferCommands", false);
    cached.feedback.promise = mongoose
      .connect(process.env.MONGODB_URI, { dbName: "feedback_system" })
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

// ---------- nicetechDB (NICETECH) ----------
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

// Create the NICETECH connection immediately (cached globally)
const nicetechDB = createNicetechConnection();

// ---------- Exports (same names as before) ----------
export { connectDB, nicetechDB };
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./db");

dotenv.config();

const authRoutes = require("./routes/auth");
const studentRoutes = require("./routes/student");
const subjectRoutes = require("./routes/subjects");
const feedbackRoutes = require("./routes/feedback");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/admin", require("./routes/admin"));
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/feedback", feedbackRoutes);

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB Connection Failed:", err);
    process.exit(1);
  }
})();
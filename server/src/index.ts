import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/db";
import { initializeFirebase } from "./config/firebase";
import userRoutes from "./routes/users";
import jobRoutes from "./routes/jobs";
import adminRoutes from "./routes/admin";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "VaaniKaam API running (TS)" });
});

app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const startServer = async () => {
  try {
    // Initialize Firebase
    initializeFirebase();
    
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("Failed to start server", error);
    // do not exit so developer can still use other parts
  }
};

startServer();

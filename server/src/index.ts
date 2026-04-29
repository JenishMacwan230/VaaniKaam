import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "node:path";
import connectDB from "./config/db";
import { initializeFirebase } from "./config/firebase";
import userRoutes from "./routes/users";
import jobRoutes from "./routes/jobs";
import adminRoutes from "./routes/admin";
import notificationRoutes from "./routes/notifications";
import contactRoutes from "./routes/contact";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

const allowedOrigins = process.env.CLIENT_URL 
  ? [process.env.CLIENT_URL] 
  : ["http://localhost:3000", "http://127.0.0.1:3000"];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "VaaniKaam API running (TS)" });
});

app.use("/api/users", userRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contact", contactRoutes);

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

import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  const mongoUriRaw = process.env.MONGO_URI;
  if (!mongoUriRaw) {
    throw new Error("MONGO_URI is not set");
  }

  const mongoUri = mongoUriRaw.replace(/^['\"]|['\"]$/g, "");

  try {
    await mongoose.connect(mongoUri, { autoIndex: true });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed", err);
    // rethrow so caller can decide
    throw err;
  }
};

export default connectDB;

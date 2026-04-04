"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    const mongoUriRaw = process.env.MONGO_URI;
    if (!mongoUriRaw) {
        throw new Error("MONGO_URI is not set");
    }
    const mongoUri = mongoUriRaw.replace(/^['\"]|['\"]$/g, "");
    try {
        await mongoose_1.default.connect(mongoUri, { autoIndex: true });
        console.log("MongoDB connected");
    }
    catch (err) {
        console.error("MongoDB connection failed", err);
        // rethrow so caller can decide
        throw err;
    }
};
exports.default = connectDB;

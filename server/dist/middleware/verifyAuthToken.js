"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const verifyAuthToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        const cookieToken = req.cookies?.authToken;
        const token = bearerToken || cookieToken || null;
        if (!token) {
            return res.status(401).json({ message: "Missing authentication token" });
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ message: "JWT_SECRET is not set" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if (!decoded.userId) {
            return res.status(401).json({ message: "Invalid token payload" });
        }
        const user = await User_1.default.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        req.auth = { userId: user.id, activeRole: decoded.activeRole || user.activeRole };
        req.user = user;
        return next();
    }
    catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.default = verifyAuthToken;

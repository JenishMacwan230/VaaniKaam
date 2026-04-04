"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAnyRole = exports.requireRole = void 0;
const User_1 = __importDefault(require("../models/User"));
const ensureUser = async (req) => {
    if (req.user)
        return req.user;
    if (!req.auth?.userId)
        return null;
    const user = await User_1.default.findById(req.auth.userId);
    req.user = user;
    return user;
};
const requireRole = (role) => async (req, res, next) => {
    try {
        const user = await ensureUser(req);
        if (!user)
            return res.status(401).json({ message: "User not found" });
        if (!user.isActive)
            return res.status(403).json({ message: "User is deactivated" });
        const activeRole = req.auth?.activeRole || user.activeRole;
        if (activeRole !== role || !user.roles.includes(role)) {
            return res.status(403).json({ message: "Insufficient role access" });
        }
        req.auth.activeRole = activeRole;
        return next();
    }
    catch (error) {
        return res.status(500).json({ message: "Role verification failed" });
    }
};
exports.requireRole = requireRole;
const requireAnyRole = (roles) => async (req, res, next) => {
    try {
        const user = await ensureUser(req);
        if (!user)
            return res.status(401).json({ message: "User not found" });
        if (!user.isActive)
            return res.status(403).json({ message: "User is deactivated" });
        const activeRole = req.auth?.activeRole || user.activeRole;
        if (!activeRole || !roles.includes(activeRole) || !user.roles.includes(activeRole)) {
            return res.status(403).json({ message: "Insufficient role access" });
        }
        req.auth.activeRole = activeRole;
        return next();
    }
    catch (error) {
        return res.status(500).json({ message: "Role verification failed" });
    }
};
exports.requireAnyRole = requireAnyRole;

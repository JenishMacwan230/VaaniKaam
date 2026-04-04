"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.deleteJob = exports.getAllJobs = exports.updateUserStatus = exports.getAllUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const Job_1 = __importDefault(require("../models/Job"));
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.default.find().sort({ createdAt: -1 });
        return res.json({ users });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch users" });
    }
};
exports.getAllUsers = getAllUsers;
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body || {};
        if (typeof isActive !== "boolean")
            return res.status(400).json({ message: "isActive must be boolean" });
        const user = await User_1.default.findByIdAndUpdate(id, { isActive }, { new: true });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        return res.json({ user });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to update user" });
    }
};
exports.updateUserStatus = updateUserStatus;
const getAllJobs = async (req, res) => {
    try {
        const jobs = await Job_1.default.find().populate("postedBy", "name email activeRole");
        return res.json({ jobs });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch jobs" });
    }
};
exports.getAllJobs = getAllJobs;
const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job_1.default.findByIdAndDelete(id);
        if (!job)
            return res.status(404).json({ message: "Job not found" });
        return res.json({ message: "Job deleted" });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to delete job" });
    }
};
exports.deleteJob = deleteJob;
const getStats = async (req, res) => {
    try {
        const [totalUsers, totalWorkers, totalCompanies, totalJobs] = await Promise.all([
            User_1.default.countDocuments(),
            User_1.default.countDocuments({ roles: "worker" }),
            User_1.default.countDocuments({ roles: "company" }),
            Job_1.default.countDocuments(),
        ]);
        return res.json({ totalUsers, totalWorkers, totalCompanies, totalJobs });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch stats" });
    }
};
exports.getStats = getStats;

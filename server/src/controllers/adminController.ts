import { Request, Response } from "express";
import User from "../models/User";
import Job from "../models/Job";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};
    if (typeof isActive !== "boolean") return res.status(400).json({ message: "isActive must be boolean" });
    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update user" });
  }
};

export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find().populate("postedBy", "name email activeRole");
    return res.json({ jobs });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await Job.findByIdAndDelete(id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json({ message: "Job deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete job" });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalWorkers, totalCompanies, totalJobs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ roles: "worker" }),
      User.countDocuments({ roles: "company" }),
      Job.countDocuments(),
    ]);
    return res.json({ totalUsers, totalWorkers, totalCompanies, totalJobs });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
};

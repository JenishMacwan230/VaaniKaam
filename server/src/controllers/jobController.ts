import { Request, Response } from "express";
import Job from "../models/Job";
import JobApplication from "../models/JobApplication";

export const createJob = async (req: Request & any, res: Response) => {
  try {
    const { title, description, skillRequired, location, wage, date } = req.body || {};
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const job = await Job.create({ title, description, skillRequired: Array.isArray(skillRequired) ? skillRequired : [], location, wage, date, postedBy: user._id });
    return res.status(201).json({ job });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create job" });
  }
};

export const listJobs = async (req: Request, res: Response) => {
  try {
    const { status } = req.query || {};
    const filter: any = {};
    if (status) filter.status = status as string;
    const jobs = await Job.find(filter).populate("postedBy", "name email activeRole").sort({ createdAt: -1 });
    return res.json({ jobs });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const applyToJob = async (req: Request & any, res: Response) => {
  try {
    const { jobId } = req.body || {};
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    const existing = await JobApplication.findOne({ jobId, workerId: user._id });
    if (existing) return res.status(409).json({ message: "Already applied" });
    const application = await JobApplication.create({ jobId, workerId: user._id, status: "applied" });
    return res.status(201).json({ application });
  } catch (error: any) {
    if (error.code === 11000) return res.status(409).json({ message: "Already applied" });
    return res.status(500).json({ message: "Failed to apply" });
  }
};

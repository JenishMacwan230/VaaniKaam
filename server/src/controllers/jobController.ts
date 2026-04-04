import { Request, Response } from "express";
import Job from "../models/Job";
import JobApplication from "../models/JobApplication";

export const createJob = async (req: Request & any, res: Response) => {
  try {
    // Support both field name formats
    const {
      title,
      description,
      skillRequired,
      location,
      wage,
      date,
      // New format from add-works form
      category,
      pricingType,
      pricingAmount,
      urgency,
    } = req.body || {};

    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Map new field names to old ones if provided
    const finalWage = wage || pricingAmount;
    const finalSkills = skillRequired || (category ? [category] : []);

    const job = await Job.create({
      title,
      description,
      skillRequired: Array.isArray(finalSkills) ? finalSkills : [],
      location,
      wage: finalWage,
      date,
      category,
      pricingType,
      urgency,
      postedBy: user._id,
    });

    return res.status(201).json({ job });
  } catch (error) {
    console.error("Create job error:", error);
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

export const getContractorJobs = async (req: Request & any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get all jobs posted by the contractor with application counts
    const jobs = await Job.find({ postedBy: user._id }).sort({ createdAt: -1 });

    // For each job, get the application count and details
    const jobsWithApplications = await Promise.all(
      jobs.map(async (job) => {
        const applications = await JobApplication.find({ jobId: job._id })
          .populate("workerId", "name email proficiency location")
          .sort({ createdAt: -1 });
        
        return {
          ...job.toObject(),
          applicationsCount: applications.length,
          applications: applications.slice(0, 3), // Latest 3 applications
        };
      })
    );

    return res.json({ jobs: jobsWithApplications });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch contractor jobs" });
  }
};

export const getContractorStats = async (req: Request & any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const totalJobs = await Job.countDocuments({ postedBy: user._id });
    const openJobs = await Job.countDocuments({ postedBy: user._id, status: "open" });
    const assignedJobs = await Job.countDocuments({ postedBy: user._id, status: "assigned" });
    const completedJobs = await Job.countDocuments({ postedBy: user._id, status: "completed" });

    // Get total applications
    const contractorJobs = await Job.find({ postedBy: user._id });
    const jobIds = contractorJobs.map(j => j._id);
    const totalApplications = await JobApplication.countDocuments({ jobId: { $in: jobIds } });

    return res.json({
      stats: {
        totalJobs,
        openJobs,
        assignedJobs,
        completedJobs,
        totalApplications,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch contractor stats" });
  }
};

export const getRecentApplications = async (req: Request & any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get all jobs by the contractor
    const contractorJobs = await Job.find({ postedBy: user._id });
    const jobIds = contractorJobs.map(j => j._id);

    // Get recent applications for these jobs
    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .populate("jobId", "title status")
      .populate("workerId", "name email proficiency location workCategory")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({ applications });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch recent applications" });
  }
};

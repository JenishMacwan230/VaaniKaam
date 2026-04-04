"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentApplications = exports.getContractorStats = exports.getContractorJobs = exports.applyToJob = exports.listJobs = exports.createJob = void 0;
const Job_1 = __importDefault(require("../models/Job"));
const JobApplication_1 = __importDefault(require("../models/JobApplication"));
const createJob = async (req, res) => {
    try {
        // Support both field name formats
        const { title, description, skillRequired, location, wage, date, 
        // New format from add-works form
        category, pricingType, pricingAmount, urgency, } = req.body || {};
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        // Map new field names to old ones if provided
        const finalWage = wage || pricingAmount;
        const finalSkills = skillRequired || (category ? [category] : []);
        const job = await Job_1.default.create({
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
    }
    catch (error) {
        console.error("Create job error:", error);
        return res.status(500).json({ message: "Failed to create job" });
    }
};
exports.createJob = createJob;
const listJobs = async (req, res) => {
    try {
        const { status } = req.query || {};
        const filter = {};
        if (status)
            filter.status = status;
        const jobs = await Job_1.default.find(filter).populate("postedBy", "name email activeRole").sort({ createdAt: -1 });
        return res.json({ jobs });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch jobs" });
    }
};
exports.listJobs = listJobs;
const applyToJob = async (req, res) => {
    try {
        const { jobId } = req.body || {};
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const job = await Job_1.default.findById(jobId);
        if (!job)
            return res.status(404).json({ message: "Job not found" });
        const existing = await JobApplication_1.default.findOne({ jobId, workerId: user._id });
        if (existing)
            return res.status(409).json({ message: "Already applied" });
        const application = await JobApplication_1.default.create({ jobId, workerId: user._id, status: "applied" });
        return res.status(201).json({ application });
    }
    catch (error) {
        if (error.code === 11000)
            return res.status(409).json({ message: "Already applied" });
        return res.status(500).json({ message: "Failed to apply" });
    }
};
exports.applyToJob = applyToJob;
const getContractorJobs = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        // Get all jobs posted by the contractor with application counts
        const jobs = await Job_1.default.find({ postedBy: user._id }).sort({ createdAt: -1 });
        // For each job, get the application count and details
        const jobsWithApplications = await Promise.all(jobs.map(async (job) => {
            const applications = await JobApplication_1.default.find({ jobId: job._id })
                .populate("workerId", "name email proficiency location")
                .sort({ createdAt: -1 });
            return {
                ...job.toObject(),
                applicationsCount: applications.length,
                applications: applications.slice(0, 3), // Latest 3 applications
            };
        }));
        return res.json({ jobs: jobsWithApplications });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch contractor jobs" });
    }
};
exports.getContractorJobs = getContractorJobs;
const getContractorStats = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        const totalJobs = await Job_1.default.countDocuments({ postedBy: user._id });
        const openJobs = await Job_1.default.countDocuments({ postedBy: user._id, status: "open" });
        const assignedJobs = await Job_1.default.countDocuments({ postedBy: user._id, status: "assigned" });
        const completedJobs = await Job_1.default.countDocuments({ postedBy: user._id, status: "completed" });
        // Get total applications
        const contractorJobs = await Job_1.default.find({ postedBy: user._id });
        const jobIds = contractorJobs.map(j => j._id);
        const totalApplications = await JobApplication_1.default.countDocuments({ jobId: { $in: jobIds } });
        return res.json({
            stats: {
                totalJobs,
                openJobs,
                assignedJobs,
                completedJobs,
                totalApplications,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch contractor stats" });
    }
};
exports.getContractorStats = getContractorStats;
const getRecentApplications = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        // Get all jobs by the contractor
        const contractorJobs = await Job_1.default.find({ postedBy: user._id });
        const jobIds = contractorJobs.map(j => j._id);
        // Get recent applications for these jobs
        const applications = await JobApplication_1.default.find({ jobId: { $in: jobIds } })
            .populate("jobId", "title status")
            .populate("workerId", "name email proficiency location workCategory")
            .sort({ createdAt: -1 })
            .limit(10);
        return res.json({ applications });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to fetch recent applications" });
    }
};
exports.getRecentApplications = getRecentApplications;

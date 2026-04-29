import { Request, Response } from "express";
import Job from "../models/Job";
import JobApplication from "../models/JobApplication";
import User from "../models/User";
import { Notification } from "../models/Notification";
import { createNotification } from "../utils/notificationHelper";

const syncJobStatusFromApplications = async (jobId: any) => {
  const job = await Job.findById(jobId);
  if (!job) return;

  const applications = await JobApplication.find({ jobId: job._id });

  const hasCompletionPending = applications.some((app) => app.status === "completion_pending");
  const hasAccepted = applications.some((app) => app.status === "accepted");
  const hasCompleted = applications.some((app) => app.status === "completed");

  let nextStatus: "open" | "in_progress" | "completion_pending" | "completed" = "open";

  if (hasCompletionPending) {
    nextStatus = "completion_pending";
  } else if (hasAccepted) {
    nextStatus = "in_progress";
  } else if (hasCompleted) {
    nextStatus = "completed";
  }

  await Job.findByIdAndUpdate(job._id, { status: nextStatus });
};

export const createJob = async (req: Request & any, res: Response) => {
  try {
    // Support both field name formats
    const {
      title,
      description,
      skillRequired,
      location,
      normalizedLocation,
      isLocationNormalized,
      latitude,
      longitude,
      wage,
      date,
      category,
      pricingType,
      pricingAmount,
      urgency,
      // Structured duration fields
      duration_value,
      duration_unit,
      workersRequired,
      jobDate,
      selectedDate,
    } = req.body || {};

    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const finalWage = wage || pricingAmount;
    const finalSkills = skillRequired || (category ? [category] : []);

    const job = await Job.create({
      title,
      description,
      skillRequired: Array.isArray(finalSkills) ? finalSkills : [],
      location,
      normalizedLocation,
      isLocationNormalized: isLocationNormalized || false,
      latitude,
      longitude,
      wage: finalWage,
      pricingAmount: pricingAmount || finalWage,
      date,
      category,
      pricingType,
      urgency,
      // Structured duration fields
      duration_value: duration_value || 1,
      duration_unit: duration_unit || "day",
      workersRequired: workersRequired || 1,
      jobDate: jobDate || "today",
      selectedDate,
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
    console.error("Error fetching jobs:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ 
      message: "Failed to fetch jobs",
      error: errorMessage,
    });
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
    
    // 📬 Create notification for job poster
    try {
      await createNotification({
        userId: job.postedBy.toString(),
        type: "application",
        title: "New Application Received",
        message: `${user.name || "Someone"} applied for "${job.title}"`,
        data: {
          jobId: job._id.toString(),
          applicationId: application._id.toString(),
          workerId: user._id.toString(),
        },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
      // Don't fail the request if notification creation fails
    }
    
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

export const getJobById = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId)
      .populate("postedBy", "name email");
    
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Get all applications for this job with worker details
    const applications = await JobApplication.find({ jobId: job._id })
      .populate("workerId", "name email phone proficiency location")
      .sort({ createdAt: -1 });

    return res.json({
      job: {
        ...job.toObject(),
        applications: applications,
      },
    });
  } catch (error) {
    console.error("Get job error:", error);
    return res.status(500).json({ message: "Failed to fetch job details" });
  }
};

export const updateApplicationStatus = async (req: Request & any, res: Response) => {
  try {
    const { applicationId, action } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get the application
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify the job belongs to the user
    const job = await Job.findById(application.jobId);
    const jobPostedById = job?.postedBy?.toString();
    const userId = user._id?.toString();
    if (!job || jobPostedById !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update application status
    let newStatus: any = "applied";
    if (action === "accept") {
      newStatus = "accepted";
    } else if (action === "reject") {
      newStatus = "rejected";
    }
    application.status = newStatus;
    await application.save();

    await syncJobStatusFromApplications(application.jobId);

    // 📬 Create notification when application is accepted
    if (action === "accept") {
      try {
        const worker = await User.findById(application.workerId);
        await createNotification({
          userId: application.workerId.toString(),
          type: "job_update",
          title: "Application Accepted!",
          message: `Your application for "${job.title}" has been accepted. You can now start the work.`,
          data: {
            jobId: job._id.toString(),
            applicationId: application._id.toString(),
          },
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    }

    return res.json({ application });
  } catch (error) {
    console.error("Update application error:", error);
    return res.status(500).json({ message: "Failed to update application" });
  }
};

export const deleteJob = async (req: Request & any, res: Response) => {
  try {
    const { jobId } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Verify job belongs to user
    const jobPostedById = job.postedBy?.toString();
    const userId = user._id?.toString();
    if (jobPostedById !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Delete job and its applications
    await Job.findByIdAndDelete(jobId);
    await JobApplication.deleteMany({ jobId: jobId });

    return res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Delete job error:", error);
    return res.status(500).json({ message: "Failed to delete job" });
  }
};

export const getWorkerApplications = async (req: Request & any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get all applications by this worker with job details
    const applications = await JobApplication.find({ workerId: user._id })
      .populate("jobId", "_id title description location latitude longitude pricingAmount pricingType category urgency jobDate duration_value duration_unit workersRequired status postedBy")
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error) {
    console.error("Get worker applications error:", error);
    return res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const getWorkerAcceptedJobs = async (req: Request & any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get all ACCEPTED applications by this worker with job details
    const applications = await JobApplication.find({ 
      workerId: user._id,
      status: "accepted"
    })
      .populate("jobId", "_id title description location latitude longitude pricingAmount pricingType category urgency jobDate duration_value duration_unit workersRequired status postedBy createdAt")
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error) {
    console.error("Get worker accepted jobs error:", error);
    return res.status(500).json({ message: "Failed to fetch accepted jobs" });
  }
};

export const markJobComplete = async (req: Request & any, res: Response) => {
  try {
    const { applicationId } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get the application
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify the job belongs to the user (contractor)
    const job = await Job.findById(application.jobId);
    const jobPostedById = job?.postedBy?.toString();
    const userId = user._id?.toString();
    if (!job || jobPostedById !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update status to completion_pending
    if (application.status !== "accepted") {
      return res.status(400).json({ message: "Only accepted jobs can be marked complete" });
    }

    application.status = "completion_pending";
    await application.save();

    await syncJobStatusFromApplications(application.jobId);

    // 📬 Create notification for worker to confirm completion
    try {
      await createNotification({
        userId: application.workerId.toString(),
        type: "job_update",
        title: "Job Completion Review",
        message: `${user.name || "Contractor"} marked "${job.title}" as complete. Please confirm the work is done.`,
        data: {
          jobId: job._id.toString(),
          applicationId: application._id.toString(),
        },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return res.json({ application });
  } catch (error) {
    console.error("Mark job complete error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: `Failed to mark job complete: ${errorMessage}` });
  }
};

export const getWorkerPendingCompletion = async (req: Request & any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get all COMPLETION_PENDING applications by this worker with job details
    const applications = await JobApplication.find({ 
      workerId: user._id,
      status: "completion_pending"
    })
      .populate("jobId", "_id title description location latitude longitude pricingAmount pricingType category urgency jobDate duration_value duration_unit workersRequired status postedBy createdAt")
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error) {
    console.error("Get worker pending completion error:", error);
    return res.status(500).json({ message: "Failed to fetch pending completion jobs" });
  }
};

export const confirmJobCompletion = async (req: Request & any, res: Response) => {
  try {
    const { applicationId } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get the application
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify the worker owns this application
    const workerId = application.workerId?.toString();
    const userId = user._id?.toString();
    if (workerId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update status to completed
    if (application.status !== "completion_pending") {
      return res.status(400).json({ message: "Only completion_pending jobs can be confirmed" });
    }

    application.status = "completed";
    await application.save();

    await syncJobStatusFromApplications(application.jobId);

    // 📬 Create notification for contractor - job is completed
    try {
      const job = await Job.findById(application.jobId);
      const contractor = await User.findById(job?.postedBy);
      await createNotification({
        userId: job?.postedBy.toString() as string,
        type: "job_update",
        title: "Job Completed ✓",
        message: `${user.name || "Worker"} confirmed completion of "${job?.title}". Payment can now be processed.`,
        data: {
          jobId: job?._id.toString(),
          applicationId: application._id.toString(),
          workerId: user._id.toString(),
        },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return res.json({ application });
  } catch (error) {
    console.error("Confirm job completion error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: `Failed to confirm completion: ${errorMessage}` });
  }
};

export const rejectJobCompletion = async (req: Request & any, res: Response) => {
  try {
    const { applicationId } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get the application
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Verify the worker owns this application
    const workerId = application.workerId?.toString();
    const userId = user._id?.toString();
    if (workerId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update status back to accepted
    if (application.status !== "completion_pending") {
      return res.status(400).json({ message: "Only completion_pending jobs can be rejected" });
    }

    application.status = "accepted";
    await application.save();

    await syncJobStatusFromApplications(application.jobId);

    return res.json({ application });
  } catch (error) {
    console.error("Reject job completion error:", error);
    return res.status(500).json({ message: "Failed to reject job completion" });
  }
};

export const markAllJobsComplete = async (req: Request & any, res: Response) => {
  try {
    const { jobId } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Verify the job exists and belongs to the contractor
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    
    const jobPostedById = job.postedBy?.toString();
    const userId = user._id?.toString();
    if (jobPostedById !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Find all accepted applications for this job
    const acceptedApplications = await JobApplication.find({ 
      jobId, 
      status: "accepted" 
    }).populate("workerId", "name");

    if (acceptedApplications.length === 0) {
      return res.status(400).json({ message: "No accepted applications to mark complete" });
    }

    // Atomic updateMany: update all accepted applications to completion_pending
    const updateResult = await JobApplication.updateMany(
      { jobId, status: "accepted" },
      { $set: { status: "completion_pending" } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({ message: "Failed to update applications" });
    }

    // Sync job status after bulk update
    await syncJobStatusFromApplications(jobId);

    // Create notifications for all affected workers (bulk insert)
    const notifications = acceptedApplications.map((app) => ({
      userId: app.workerId._id.toString(),
      type: "job_update",
      title: "Job Completion Review",
      message: `${user.name || "Contractor"} marked "${job.title}" as complete. Please confirm the work is done.`,
      data: {
        jobId: job._id.toString(),
        applicationId: app._id.toString(),
      },
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    try {
      await Notification.insertMany(notifications);
    } catch (notifError) {
      console.error("Failed to create notifications:", notifError);
      // Don't fail the request if notification creation fails
    }

    return res.json({
      success: true,
      data: {
        updatedCount: updateResult.modifiedCount,
        message: `Marked ${updateResult.modifiedCount} application(s) as complete`,
      },
    });
  } catch (error) {
    console.error("Mark all jobs complete error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message: `Failed to mark jobs complete: ${errorMessage}` });
  }
};

export const getWorkerCompletedJobs = async (req: Request & any, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get all COMPLETED applications by this worker with job details
    const applications = await JobApplication.find({ 
      workerId: user._id,
      status: "completed"
    })
      .populate("jobId", "_id title description location latitude longitude pricingAmount pricingType category urgency jobDate duration_value duration_unit workersRequired status postedBy createdAt")
      .sort({ createdAt: -1 });

    return res.json({ applications });
  } catch (error) {
    console.error("Get worker completed jobs error:", error);
    return res.status(500).json({ message: "Failed to fetch completed jobs" });
  }
};

export const confirmPayment = async (req: Request & any, res: Response) => {
  try {
    const { applicationId, paymentMethod } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get the application
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    // Verify the worker owns this application
    const workerId = application.workerId?.toString();
    const userId = user._id?.toString();
    if (workerId !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    // Guard: status must be completed
    if (application.status !== "completed") {
      return res.status(400).json({ success: false, error: "Job must be completed before confirming payment" });
    }

    // Guard: paymentStatus must be pending (prevent double confirm)
    if (application.paymentStatus !== "pending") {
      return res.status(400).json({ success: false, error: "Payment already processed" });
    }

    // Update payment info
    application.paymentStatus = "confirmed_paid";
    application.paymentMethod = paymentMethod;
    application.paidAt = new Date();
    await application.save();

    // Send notification to contractor
    try {
      const job = await Job.findById(application.jobId);
      await createNotification({
        userId: job?.postedBy.toString() as string,
        type: "payment",
        title: "Payment Confirmed",
        message: `${user.name || "Worker"} confirmed payment receipt for "${job?.title}"`,
        data: {
          jobId: job?._id.toString(),
          applicationId: application._id.toString(),
          workerId: user._id.toString(),
        },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return res.json({ success: true, data: application });
  } catch (error) {
    console.error("Confirm payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: `Failed to confirm payment: ${errorMessage}` });
  }
};

export const disputePayment = async (req: Request & any, res: Response) => {
  try {
    const { applicationId } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Get the application
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    // Verify the worker owns this application
    const workerId = application.workerId?.toString();
    const userId = user._id?.toString();
    if (workerId !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    // Guard: status must be completed
    if (application.status !== "completed") {
      return res.status(400).json({ success: false, error: "Job must be completed before disputing payment" });
    }

    // Guard: paymentStatus must be pending (prevent double dispute)
    if (application.paymentStatus !== "pending") {
      return res.status(400).json({ success: false, error: "Payment already processed" });
    }

    // Update payment status to disputed
    application.paymentStatus = "disputed";
    await application.save();

    // Send notification to contractor
    try {
      const job = await Job.findById(application.jobId);
      await createNotification({
        userId: job?.postedBy.toString() as string,
        type: "payment",
        title: "Payment Dispute Reported",
        message: `${user.name || "Worker"} reported a payment issue for "${job?.title}"`,
        data: {
          jobId: job?._id.toString(),
          applicationId: application._id.toString(),
          workerId: user._id.toString(),
        },
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    return res.json({ success: true, data: application });
  } catch (error) {
    console.error("Dispute payment error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: `Failed to dispute payment: ${errorMessage}` });
  }
};

export const rateUser = async (req: Request & any, res: Response) => {
  try {
    const { applicationId, score, review } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Validate score
    if (typeof score !== "number" || score < 1 || score > 5) {
      return res.status(400).json({ success: false, error: "Score must be between 1 and 5" });
    }

    // Validate review length
    if (review && typeof review === "string" && review.length > 200) {
      return res.status(400).json({ success: false, error: "Review must be 200 characters or less" });
    }

    // Get the application
    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    // Guard: paymentStatus must be "confirmed_paid"
    if (application.paymentStatus !== "confirmed_paid") {
      return res.status(400).json({ success: false, error: "Can only rate after payment is confirmed" });
    }

    // Guard: status must be completed
    if (application.status !== "completed") {
      return res.status(400).json({ success: false, error: "Can only rate completed jobs" });
    }

    // Determine if caller is worker or contractor
    const userIdStr = user._id?.toString();
    const workerIdStr = application.workerId?.toString();
    const isWorker = userIdStr === workerIdStr;

    // Get job to find contractor
    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }

    const contractorIdStr = job.postedBy?.toString();
    const isContractor = userIdStr === contractorIdStr;

    if (!isWorker && !isContractor) {
      return res.status(403).json({ success: false, error: "You are not part of this job" });
    }

    // Determine which rating to update
    if (isWorker) {
      // Worker is rating the contractor
      if (application.contractorRating?.givenAt) {
        return res.status(400).json({ success: false, error: "You have already rated this contractor" });
      }
      application.contractorRating = {
        score,
        review: review || "",
        givenAt: new Date(),
      };

      // Update contractor's average rating
      const contractor = await User.findById(contractorIdStr);
      if (contractor) {
        const newAvg =
          ((contractor.averageRating || 0) * (contractor.totalRatings || 0) + score) /
          ((contractor.totalRatings || 0) + 1);
        contractor.averageRating = Math.round(newAvg * 10) / 10;
        contractor.totalRatings = (contractor.totalRatings || 0) + 1;
        await contractor.save();
      }
    } else {
      // Contractor is rating the worker
      if (application.workerRating?.givenAt) {
        return res.status(400).json({ success: false, error: "You have already rated this worker" });
      }
      application.workerRating = {
        score,
        review: review || "",
        givenAt: new Date(),
      };

      // Update worker's average rating
      const worker = await User.findById(workerIdStr);
      if (worker) {
        const newAvg =
          ((worker.averageRating || 0) * (worker.totalRatings || 0) + score) /
          ((worker.totalRatings || 0) + 1);
        worker.averageRating = Math.round(newAvg * 10) / 10;
        worker.totalRatings = (worker.totalRatings || 0) + 1;
        await worker.save();
      }
    }

    await application.save();

    return res.json({ success: true, data: application });
  } catch (error) {
    console.error("Rate user error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ success: false, error: `Failed to rate: ${errorMessage}` });
  }
};

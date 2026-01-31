import { Request, Response, NextFunction } from "express";
import User from "../models/User";

const ensureUser = async (req: Request & any) => {
  if (req.user) return req.user;
  if (!req.auth?.userId) return null;
  const user = await User.findById(req.auth.userId);
  req.user = user;
  return user;
};

export const requireRole = (role: string) => async (req: Request & any, res: Response, next: NextFunction) => {
  try {
    const user = await ensureUser(req);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "User is deactivated" });
    const activeRole = req.auth?.activeRole || user.activeRole;
    if (activeRole !== role || !user.roles.includes(role)) {
      return res.status(403).json({ message: "Insufficient role access" });
    }
    req.auth.activeRole = activeRole;
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Role verification failed" });
  }
};

export const requireAnyRole = (roles: string[]) => async (req: Request & any, res: Response, next: NextFunction) => {
  try {
    const user = await ensureUser(req);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "User is deactivated" });
    const activeRole = req.auth?.activeRole || user.activeRole;
    if (!activeRole || !roles.includes(activeRole) || !user.roles.includes(activeRole)) {
      return res.status(403).json({ message: "Insufficient role access" });
    }
    req.auth.activeRole = activeRole;
    return next();
  } catch (error) {
    return res.status(500).json({ message: "Role verification failed" });
  }
};

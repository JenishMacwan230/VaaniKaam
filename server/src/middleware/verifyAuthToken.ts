import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

const verifyAuthToken = async (req: Request & any, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers.authorization as string) || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Missing Authorization token" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not set" });
    }

    const decoded: any = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.auth = { userId: user._id.toString(), activeRole: decoded.activeRole || user.activeRole };
    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyAuthToken;

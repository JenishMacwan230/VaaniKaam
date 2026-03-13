import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

interface AuthenticatedRequest extends Request {
  auth?: { userId: string; activeRole?: string };
  user?: any;
  cookies?: Record<string, string>;
}

const verifyAuthToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers.authorization as string) || "";
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

    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & { userId?: string; activeRole?: string };
    if (!decoded.userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.auth = { userId: user.id, activeRole: decoded.activeRole || user.activeRole };
    req.user = user;

    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyAuthToken;

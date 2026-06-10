import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    premiumStatus: string;
    institution: string;
  };
}

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  premiumStatus: string;
  institution: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as DecodedToken;

    (req as AuthenticatedRequest).user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      premiumStatus: decoded.premiumStatus,
      institution: decoded.institution
    };

    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

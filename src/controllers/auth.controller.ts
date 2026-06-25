import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { MailService } from "../services/mail.service";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "24h") as jwt.SignOptions["expiresIn"];

function buildToken(user: { id: string; name: string; email: string; premiumStatus: string; institution: string }) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, premiumStatus: user.premiumStatus, institution: user.institution },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, premiumStatus, institution, avatar } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: "User with this email already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          premiumStatus: premiumStatus || "free",
          institution: institution || "",
          avatar: avatar || "",
        },
      });

      // Send welcome email
      MailService.sendWelcomeEmail(user.email, user.name).catch(console.error);

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({
        user: userWithoutPassword,
        jwt: { accessToken: buildToken(user), tokenType: "Bearer", expiresIn: 86400 },
      });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.password) return res.status(401).json({ error: "Invalid email or password" });

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ error: "Invalid email or password" });

      // Send login notification email
      const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
      const userAgent = req.headers["user-agent"] || "Unknown Device";
      MailService.sendLoginNotification(user.email, user.name, ip, userAgent).catch(console.error);

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        jwt: { accessToken: buildToken(user), tokenType: "Bearer", expiresIn: 86400 },
      });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      if (!user) return res.status(401).json({ error: "Unauthorized" });

      const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
      MailService.sendLogoutNotification(user.email, user.name, ip).catch(console.error);

      res.json({ message: "Logged out successfully" });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: "User not found" });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }
}

export const authController = new AuthController();

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "24h") as jwt.SignOptions["expiresIn"];

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, premiumStatus, institution, avatar } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          premiumStatus: premiumStatus || "free",
          institution: institution || "",
          avatar: avatar || ""
        }
      });

      // Generate token
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          premiumStatus: user.premiumStatus,
          institution: user.institution
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Don't return password
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        user: userWithoutPassword,
        jwt: {
          accessToken: token,
          tokenType: "Bearer",
          expiresIn: 86400
        }
      });
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Compare password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate token
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          premiumStatus: user.premiumStatus,
          institution: user.institution
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Don't return password
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        jwt: {
          accessToken: token,
          tokenType: "Bearer",
          expiresIn: 86400
        }
      });
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      // req.user will be populated by authMiddleware
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (e: unknown) {
      const err = e as Error;
      res.status(500).json({ error: err.message });
    }
  }
}

export const authController = new AuthController();

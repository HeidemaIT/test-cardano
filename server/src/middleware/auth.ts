import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService.js';

// Extend Express Request interface to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

export interface AuthMiddleware {
  authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  requireAuth: (req: Request, res: Response, next: NextFunction) => void;
}

// Simple JWT validation (in production, you'd want to use a proper JWT library)
function validateJWT(token: string): { id: string; email: string } | null {
  try {
    // For now, we'll use a simple approach
    // In production, you should validate the JWT with Supabase's public key
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    if (!decoded.sub || !decoded.email) {
      return null;
    }

    return {
      id: decoded.sub,
      email: decoded.email,
    };
  } catch (error) {
    console.error('JWT validation error:', error);
    return null;
  }
}

export const authMiddleware: AuthMiddleware = {
  authenticate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7);
      const userData = validateJWT(token);

      if (!userData) {
        return next();
      }

      // Ensure user exists in database
      let user = await UserService.getUserById(userData.id);
      if (!user) {
        user = await UserService.createUser(userData.id, userData.email);
      } else if (user.email !== userData.email) {
        // Update email if it changed
        user = await UserService.updateUser(userData.id, userData.email);
      }

      req.user = {
        id: user.id,
        email: user.email,
      };

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      next();
    }
  },

  requireAuth: (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to access this resource',
      });
    }
    next();
  },
};

// Global Express Request type augmentation.
// Adds `user`, `sessionId`, and `startTime` to all Request objects so that
// route handlers and middleware can access them without explicit AuthenticatedRequest casts.
// This file is picked up automatically by TypeScript via tsconfig include: ["src/**/*"].

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
      apiKey: string;
    };
    sessionId?: string;
    startTime?: number;
  }
}

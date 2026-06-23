import { Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { sendUnauthorized } from "../utils/response";
import { AuthRequest } from "../types";

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    sendUnauthorized(res, "No token provided");
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = verifyToken(token);
    console.log("token check")
    console.log(req.user)
    next();
  } catch {
    sendUnauthorized(res, "Invalid or expired token");
  }
};

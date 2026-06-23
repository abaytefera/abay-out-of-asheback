import { Router } from "express";
import * as authController from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  verify2FASchema,
} from "./auth.dto";

import { authLimiter } from "../../middleware/rateLimiters";
const authRouter = Router();

// ── Public Access Handlers ───────────────────────────────────────────────────
authRouter.post("/register",authLimiter, validate(registerSchema), authController.register);
authRouter.post("/login",authLimiter, validate(loginSchema), authController.login);
authRouter.post("/refresh", validate(refreshTokenSchema), authController.refresh);
authRouter.post("/2fa/verify", validate(verify2FASchema), authController.verify2FA);

// ── Protected Application Context Lines ──────────────────────────────────────
authRouter.use(authenticate);
authRouter.get("/me", authController.me);
authRouter.post("/2fa/setup", authController.setup2FA);
// 💡 NEW: Exposed endpoint matching the frontend RTK Query payload configurations
authRouter.post("/2fa/disable", validate(verify2FASchema), authController.disable2FA);

export default authRouter;
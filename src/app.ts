import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import "dotenv/config";

import { errorHandler } from "./middleware/errorHandler";
import { auditLogger } from "./middleware/auditLogger";
import analyticsRouter from "./modules/Analytics/Analytics.router";
// ── Module Routers ─────────────────────────────────────────────────────────────
import authRouter from "./modules/auth/auth.router";
import childrenRouter from "./modules/children/children.router";
import householdsRouter from "./modules/households/households.router";

import Assesmentrouter from "./modules/assessments/vulnerabilityAssessment.router";
import {homeVisitsRouter} from "./modules/homeVisits/homeVisits.router";
import educationRouter from "./modules/education/education.router";
import sponsorshipRouter from "./modules/sponsorship/sponsorship.router";
import safeguardingRouter from "./modules/safeguarding/safeguarding.router";
import healthRouter from "./modules/health/health.router";
import psychosocialRouter from "./modules/psychosocial/psychosocial.router";
import financialRouter from "./modules/financial/financial.router";
import staffRouter from "./modules/staff/staff.router";
import NotificationRouter from "./modules/notification/notification.routes";
import otherFilerouter from "./modules/otherfile/otherRecord.router";
import LogAuditrouter from "./modules/auditLog/auditLog.routes";
import Shoolrouter from "./modules/school/school.routes";
import { appointmentsRouter } from "./modules/Appointment/Appointment.router";
const app = express();

// ── Global Base Configuration Context ─────────────────────────────────────────
const API = "/api/v1";

// ── Security & Compression Middleware ──────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
    frameguard: false, // ✅ correct option — actually disables X-Frame-Options
  })
);

// Belt-and-braces, and the modern/standard way browsers decide framing:
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *"); // lock to your real frontend origin(s) in prod
  next();
});
app.use(compression());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? "*",
    credentials: true,
  })
);

// ── Rate Limiting Rules Matrices ───────────────────────────────────────────────




// 💡 FIX: Rate limit routes now use the matching nested API string template context footprint


// ── Body Parsing Middleware ────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Traffic Logging ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Static Assets Pipeline ─────────────────────────────────────────────────────
// ── Static Assets Pipeline ─────────────────────────────────────────────────────
// ── Static Assets Pipeline ─────────────────────────────────────────────────────
app.use(
  "/uploads",
  (req, res, next) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    next();
  },
  express.static(path.join(process.cwd(), "uploads"))
);

// ── System Operational Audit Middleware ────────────────────────────────────────
app.use("/api", auditLogger);

// ── Infrastructure Health Ping Check ───────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(), 
    env: process.env.NODE_ENV 
  });
});

// ── Structural Module Base Endpoints ───────────────────────────────────────────
app.use(`${API}/auth`, authRouter);
app.use(`${API}/children`, childrenRouter);
app.use(`${API}/otherFile`, otherFilerouter);

app.use(`${API}/notifications`,NotificationRouter);
app.use(`${API}/households`, householdsRouter);
app.use(`${API}/assessments`, Assesmentrouter);
app.use(`${API}/home-visits`, homeVisitsRouter);
app.use(`${API}/education`, educationRouter);
app.use(`${API}/sponsorship`, sponsorshipRouter);
app.use(`${API}/safeguarding`, safeguardingRouter);
app.use(`${API}/health`, healthRouter);
app.use(`${API}/psychosocial`, psychosocialRouter);
app.use(`${API}/financial`, financialRouter);
app.use(`${API}/staff`, staffRouter);
app.use(`${API}/logaudit`, LogAuditrouter);
app.use(`${API}/school`, Shoolrouter);
app.use(`${API}/appointments`, appointmentsRouter);

app.use(`${API}/analytics`, analyticsRouter);


 
// ── Fallback 404 Interceptor Route Handler ─────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handling Pipeline ─────────────────────────────────────────────
app.use(errorHandler);

export default app;
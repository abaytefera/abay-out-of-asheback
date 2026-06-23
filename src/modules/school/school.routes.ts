// ============================================================
// routes/school.routes.ts
// ============================================================
import { Router } from "express";
import {
  createSchool,
  getAllSchools,
  getSchoolsDropdown,
  getSchoolById,
  updateSchool,
  deleteSchool,
} from "./school.controller";


// Optional: import your existing auth middleware
// import { authenticate, authorize } from "../middleware/auth";

const Shoolrouter = Router();

// ── Public / lightweight ───────────────────────────────────
// Used by RegisterChild dropdown — no auth needed (or adjust to your setup)
Shoolrouter.get("/dropdown", getSchoolsDropdown);

// ── Full CRUD ──────────────────────────────────────────────
Shoolrouter.get(   "/",    /* authenticate, */ getAllSchools);
Shoolrouter.post(  "/",    /* authenticate, authorize("ADMIN","PROGRAM_MANAGER"), */ createSchool);
Shoolrouter.get(   "/:id", /* authenticate, */ getSchoolById);
Shoolrouter.patch( "/:id", /* authenticate, authorize("ADMIN","PROGRAM_MANAGER"), */ updateSchool);
Shoolrouter.delete("/:id", /* authenticate, authorize("ADMIN"), */ deleteSchool);

export default Shoolrouter;

// ── Mount in your main app.ts / index.ts ──────────────────
// import schoolRouter from "./routes/school.routes";
// app.use("/api/schools", schoolRouter);
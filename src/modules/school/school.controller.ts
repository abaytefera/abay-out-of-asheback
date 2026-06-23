// ============================================================
// controllers/school.controller.ts
// ============================================================
import { Request, Response } from "express";
import { SchoolService } from "./school.service";
import { CreateSchoolDto, UpdateSchoolDto, SchoolListQuery } from "./schoolTypes";


const schoolService = new SchoolService();

// ── Helper: uniform JSON response ─────────────────────────
const ok = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

const fail = (res: Response, err: unknown, status = 500) => {
  const message =
    err instanceof Error ? err.message : "Unexpected server error.";
  const isClientError =
    message.includes("already exists") ||
    message.includes("not found") ||
    message.includes("Invalid");
  return res
    .status(isClientError ? 400 : status)
    .json({ success: false, message });
};

// ── POST /api/schools ──────────────────────────────────────
export const createSchool = async (req: Request, res: Response) => {
  try {
    const dto: CreateSchoolDto = req.body;

    if (!dto.name?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "School name is required." });
    }
    if (!["PRIVATE", "GOVERMENT"].includes(dto.type)) {
      return res
        .status(400)
        .json({ success: false, message: "Type must be PRIVATE or GOVERMENT." });
    }

    const school = await schoolService.createSchool(dto);
    return ok(res, school, 201);
  } catch (err) {
    return fail(res, err);
  }
};

// ── GET /api/schools ───────────────────────────────────────
export const getAllSchools = async (req: Request, res: Response) => {
  try {
    const query: SchoolListQuery = {
      search: (req.query.search as string) || undefined,
      type:   (req.query.type   as string) as SchoolListQuery["type"] || "ALL",
    };
    const schools = await schoolService.getAllSchools(query);
    return ok(res, schools);
  } catch (err) {
    return fail(res, err);
  }
};

// ── GET /api/schools/dropdown ──────────────────────────────
export const getSchoolsDropdown = async (_req: Request, res: Response) => {
  try {
    const schools = await schoolService.getSchoolsForDropdown();
    return ok(res, schools);
  } catch (err) {
    return fail(res, err);
  }
};

// ── GET /api/schools/:id ───────────────────────────────────
export const getSchoolById = async (req: Request, res: Response) => {
  try {
    const school = await schoolService.getSchoolById(req.params.id);
    return ok(res, school);
  } catch (err) {
    return fail(res, err);
  }
};

// ── PATCH /api/schools/:id ─────────────────────────────────
export const updateSchool = async (req: Request, res: Response) => {
  try {
    const dto: UpdateSchoolDto = req.body;
    const updated = await schoolService.updateSchool(req.params.id, dto);
    return ok(res, updated);
  } catch (err) {
    return fail(res, err);
  }
};

// ── DELETE /api/schools/:id ────────────────────────────────
export const deleteSchool = async (req: Request, res: Response) => {
  try {
    const result = await schoolService.deleteSchool(req.params.id);
    return ok(res, result);
  } catch (err) {
    return fail(res, err);
  }
};
import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize, authorizeMinRole } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as controller from "./staff.controller";
import { 
  updateProfileSchema, 
  changePasswordSchema, 
  forceResetPasswordSchema, 
  updatePermissionSchema 
} from "./staff.dto";
import multer from "multer";
import path from "path";
import fs from "fs";

// ── Multer Storage Configuration ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/employee";
    // Ensure nested directories exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });
const staffRouter = Router();

staffRouter.use(authenticate);

// ── Profile Image Mutation ───────────────────────────────────────────────────
// Matches: PATCH /api/v1/staff/User/updateUserProfile
staffRouter.patch(
  "/User/updateUserProfile", 
  upload.single("profile"), 
  controller.updateUserProfileImage
);

// ── Staff Accounts Resource Routes ──────────────────────────────────────────────
staffRouter.get("/", authorizeMinRole(UserRole.PROGRAM_MANAGER), controller.getAllStaff);
staffRouter.get("/getById", controller.getStaffById);
staffRouter.put("/profiles/:id", validate(updateProfileSchema), controller.updateProfile);

// Password Management Pipelines
staffRouter.post("/me/change-password", validate(changePasswordSchema), controller.changePassword);
staffRouter.put("/resetPassword", authorize(UserRole.ADMIN), validate(forceResetPasswordSchema), controller.forceResetPassword);

// Destruction Operations
staffRouter.delete("/employees", authorize(UserRole.ADMIN), controller.deleteEmployee);
staffRouter.patch(
  "/deactivate/:id",
  authorize(UserRole.ADMIN),
  controller.deactivateEmployee
);

// ── Permissions Resource Matrix ────────────────────────────────────────────────
// staffRouter.get("/Permissions/:id", authorize(UserRole.COUNTRY_DIRECTOR), controller.getStaffPermissions);
// staffRouter.get("/Permissions/own", controller.getOwnPermissions);

// staffRouter.patch("/Permissions/:id", authorize(UserRole.COUNTRY_DIRECTOR), validate(updatePermissionSchema), controller.updateStaffPermissions);

export default staffRouter;
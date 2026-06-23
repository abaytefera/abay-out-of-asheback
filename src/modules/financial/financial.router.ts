import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorize } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { upload, disbursementSchema } from "./financial.dto";
import * as controller from "./financial.controller";

const financialRouter = Router();

financialRouter.use(authenticate);

financialRouter.get(
  "/report",
  authorize(
    UserRole.FINANCE_OFFICER,
    UserRole.PROGRAM_MANAGER,
    UserRole.COUNTRY_DIRECTOR,
    UserRole.ADMIN
  ),
  controller.getReport
);

financialRouter.get("/child/:childId", authorize(
    UserRole.FINANCE_OFFICER,
    UserRole.PROGRAM_MANAGER,
    UserRole.COUNTRY_DIRECTOR,
    UserRole.ADMIN
  ), controller.getChildFinancials);

financialRouter.post(
  "/",
  authorize(
    UserRole.FINANCE_OFFICER,
    
  ),
  upload.array("files"),
  validate(disbursementSchema),
  controller.createDisbursement
);

// ── PATCH: multer runs first so req.files is populated, then controller ──────
financialRouter.patch(
  "/:id",
  authorize(
    UserRole.FINANCE_OFFICER,
    UserRole.ADMIN
  ),
  upload.array("files"), // <-- was missing
  controller.updateDisbursement
);

financialRouter.post(
  "/:id/files",
  authorize(
    UserRole.FINANCE_OFFICER,
   
  ),
  upload.array("files"),
  controller.addFiles
);

// DELETE single file must come BEFORE DELETE whole record (more-specific path first)
financialRouter.delete(
  "/:id/files/:fileId",
  authorize(
   
    UserRole.ADMIN
  ),
  controller.deleteFile
);

financialRouter.delete(
  "/:id",
  authorize(
   
    UserRole.ADMIN
  ),
  controller.deleteDisbursement
);

export default financialRouter;
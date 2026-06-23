import { Router } from "express";
import { EducationController } from "./education.controller";
import { upload } from "./education.config";
import {
  academicRecordSchema,
  updateAcademicRecordSchema,
  materialSupportSchema,
  updateMaterialSupportSchema,
} from "./education.dto";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { authorize } from "../../middleware/authorize";
const educationRouter = Router();
const controller = new EducationController();

// Global Protection Middleware across this routing module
educationRouter.use(authenticate);

// Academic Records
educationRouter.get("/records/:childId",authorize("ADMIN","EDUCATION_OFFICER","COUNTRY_DIRECTOR","PROGRAM_MANAGER"), controller.getHistory);
educationRouter.post(
  "/records",
  authorize("EDUCATION_OFFICER"),
  upload.array("files", 10),
  validate(academicRecordSchema),
  controller.createRecord
);
educationRouter.patch(
  "/records/:recordId",
  authorize("EDUCATION_OFFICER","ADMIN"),
  upload.array("files", 10),
  validate(updateAcademicRecordSchema),
  controller.updateRecord
);
educationRouter.delete("/records/:recordId",authorize("ADMIN"), controller.deleteRecord);

// Individual file delete (for an academic record's attachment)
educationRouter.delete("/records/:recordId/files/:fileId",authorize("ADMIN"), controller.deleteRecordFile);

// Alerts Management
educationRouter.get("/alerts",authorize("ADMIN","EDUCATION_OFFICER","COUNTRY_DIRECTOR","PROGRAM_MANAGER"), controller.getAlerts);
educationRouter.patch("/alerts/:alertId/resolve",authorize("EDUCATION_OFFICER","ADMIN"), controller.resolveAlert);

// Materials Support Tracking
educationRouter.get("/materials/:childId",authorize("ADMIN","EDUCATION_OFFICER","COUNTRY_DIRECTOR","PROGRAM_MANAGER"), controller.getMaterials);
educationRouter.post("/materials",authorize("EDUCATION_OFFICER"), validate(materialSupportSchema), controller.logMaterial);
educationRouter.patch("/materials/:materialId",authorize("EDUCATION_OFFICER","ADMIN"), validate(updateMaterialSupportSchema), controller.updateMaterial);
educationRouter.delete("/materials/:materialId",authorize("ADMIN"), controller.deleteMaterial);

export default educationRouter;
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { uploadHealthFile, uploadVaccineFile } from "./health.dto";
import * as controller from "./health.controller";
import { authorize } from "../../middleware/authorize";

const healthRouter = Router();
healthRouter.use(authenticate);

// ── Health Records ──────────────────────────────────────────────
healthRouter.post("/records",     authorize("HEALTH_OFFICER"),          uploadHealthFile.array("files", 10), controller.createHealth);
healthRouter.get("/records/:childId", authorize("ADMIN","HEALTH_OFFICER","PROGRAM_MANAGER","COUNTRY_DIRECTOR")  ,     controller.getHealth);
healthRouter.put("/records/:id",    authorize("HEALTH_OFFICER","ADMIN"),         uploadHealthFile.array("files", 10), controller.updateHealth);
healthRouter.delete("/records/:id",  authorize("ADMIN"),        controller.deleteHealth);

// ── Vaccinations ─────────────────────────────────────────────────
healthRouter.post("/vaccinations",   authorize("HEALTH_OFFICER"),        uploadVaccineFile.array("files", 10), controller.addVaccine);
healthRouter.get("/vaccinations/:childId", authorize("ADMIN","HEALTH_OFFICER","PROGRAM_MANAGER","COUNTRY_DIRECTOR") ,  controller.getVaccines);
healthRouter.put("/vaccinations/:id",  authorize("HEALTH_OFFICER","ADMIN"),      uploadVaccineFile.array("files", 10), controller.updateVaccine);
healthRouter.delete("/vaccinations/:id",  authorize("ADMIN") ,   controller.deleteVaccine);

// ── Nutrition ────────────────────────────────────────────────────
healthRouter.post("/nutrition",     authorize("HEALTH_OFFICER"),         uploadHealthFile.none(), controller.addNutrition);
healthRouter.get("/nutrition/:childId", authorize("ADMIN","HEALTH_OFFICER","PROGRAM_MANAGER","COUNTRY_DIRECTOR") ,     controller.getNutrition);
healthRouter.put("/nutrition/:id",      authorize("HEALTH_OFFICER","ADMIN"),      uploadHealthFile.none(), controller.updateNutrition);
healthRouter.delete("/nutrition/:id",   authorize("ADMIN"),     controller.deleteNutrition);

// ── Shared File Management ───────────────────────────────────────
// DELETE /api/v1/health/files/:fileId?context=health|vaccine
healthRouter.delete("/files/:fileId",  authorize("ADMIN"),      controller.deleteFile);

export default healthRouter;
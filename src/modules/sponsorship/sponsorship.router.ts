import express, { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { validate } from "../../middleware/validate";
import { sponsorSchema, sponsorshipSchema } from "./sponsorship.dto";
import * as controller from "./sponsorship.controller";
import { authenticate } from "../../middleware/authenticate";

const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const createLocalStorage = (folderName: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join("uploads", folderName);
      ensureDirExists(dest);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
};

const photoUpload  = multer({ storage: createLocalStorage("Sponsor") });
const reportUpload = multer({ storage: createLocalStorage("reports") });

const sponsorshipRouter = Router();
sponsorshipRouter.use(authenticate);

// Serve uploaded files as static assets so stored URLs like
// /uploads/Sponsor/filename.jpg resolve over HTTP.
// NOTE: You can move this to your main app.ts instead:
//   app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
sponsorshipRouter.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// Sponsors Resource Matrix
sponsorshipRouter.get("/sponsors",     controller.listSponsors);
sponsorshipRouter.get("/sponsors/:id", controller.getSponsor);

// IMPORTANT: multer runs BEFORE validate() here. validate() reads req.body,
// and for a multipart/form-data request req.body is only populated once multer
// has parsed it. With validate() first req.body is empty at validation time
// and registration always failed as soon as a photo was attached.
sponsorshipRouter.post(
  "/sponsors",
  photoUpload.array("photos", 5),
  validate(sponsorSchema),
  controller.createSponsor
);
sponsorshipRouter.patch("/sponsors/:id",  validate(sponsorSchema.partial()), controller.updateSponsor);
sponsorshipRouter.delete("/sponsors/:id", controller.deleteSponsor);

// Upload Assets Attachments Sub-Routes
sponsorshipRouter.post("/sponsors/:id/photos",            photoUpload.array("photos", 5), controller.uploadPhotos);
sponsorshipRouter.delete("/sponsors/:id/photos/:photoId", controller.deletePhoto);

// Sponsorships Operational Lifecycle
sponsorshipRouter.post("/sponsorships",          validate(sponsorshipSchema), controller.createSponsorship);
sponsorshipRouter.patch("/sponsorships/:id/end", controller.endSponsorship);
sponsorshipRouter.get("/children/:childId/sponsorships", controller.getByChild);

// Progress Verification Tracking Reports
sponsorshipRouter.post("/sponsorships/:id/reports", reportUpload.array("files", 5), controller.createReport);
sponsorshipRouter.delete("/reports/files/:fileId",  controller.deleteDonorReportFile);

export default sponsorshipRouter;
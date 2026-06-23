import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { sessionSchema, tbriSchema, sessionUpdateSchema, tbriUpdateSchema } from "./psychosocial.dto";
import * as controller from "./psychosocial.controller";
import { authorize } from "../../middleware/authorize";

const psychosocialRouter = Router();
psychosocialRouter.use(authenticate);

// Psychosocial Metrics Context Pipeline
psychosocialRouter.post("/sessions", validate(sessionSchema), authorize("PSYCHOSOCIAL_OFFICER"),controller.createSession);
psychosocialRouter.get("/sessions/:childId", controller.getSessions);
psychosocialRouter.patch("/sessions/:id", validate(sessionUpdateSchema), authorize("ADMIN","PSYCHOSOCIAL_OFFICER"),controller.updateSession);
psychosocialRouter.delete("/sessions/:id", authorize("ADMIN"), controller.deleteSession);

// TBRI Strategy Framework Pipeline
psychosocialRouter.post("/tbri", validate(tbriSchema),authorize("PSYCHOSOCIAL_OFFICER"), controller.createTBRI);
psychosocialRouter.get("/tbri/:childId", controller.getTBRI);
psychosocialRouter.patch("/tbri/:id", validate(tbriUpdateSchema), authorize("ADMIN","PSYCHOSOCIAL_OFFICER"),controller.updateTBRI);
psychosocialRouter.delete("/tbri/:id", authorize("ADMIN"),controller.deleteTBRI);

export default psychosocialRouter;
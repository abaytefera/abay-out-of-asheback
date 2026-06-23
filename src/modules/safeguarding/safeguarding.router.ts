import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticate } from "../../middleware/authenticate";
import { authorizeMinRole } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { createCaseSchema, updateCaseSchema, grantAccessSchema } from "./safeguarding.dto";
import * as controller from "./safeguarding.controller";
 
const safeguardingRouter = Router();
safeguardingRouter.use(authenticate);
 
safeguardingRouter.get("/",    controller.findAllCases);
safeguardingRouter.get("/:id", controller.findOneCase);
safeguardingRouter.post("/",   validate(createCaseSchema), controller.createCase);
 
safeguardingRouter.patch("/:id",       validate(updateCaseSchema), controller.updateCase);
safeguardingRouter.patch("/:id/close", authorizeMinRole(UserRole.PROGRAM_MANAGER), controller.closeCase);
 
// Access management — COUNTRY_DIRECTOR only (above PROGRAM_MANAGER in hierarchy)
safeguardingRouter.post(  "/:id/grant-access",  authorizeMinRole(UserRole.COUNTRY_DIRECTOR), validate(grantAccessSchema), controller.grantAccess);
safeguardingRouter.delete("/:id/revoke-access", authorizeMinRole(UserRole.COUNTRY_DIRECTOR), validate(grantAccessSchema), controller.revokeAccess);
 
safeguardingRouter.delete("/:id", authorizeMinRole(UserRole.PROGRAM_MANAGER), controller.deleteCase);
 
export default safeguardingRouter;
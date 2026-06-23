import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { householdSchema, guardianSchema } from "./household.dto";
import * as controller from "./household.controller";

const householdsRouter = Router();
householdsRouter.use(authenticate);

// Household Core Resource Endpoints
householdsRouter.get("/", controller.findAllHouseholds);
householdsRouter.get("/:id", controller.findOneHousehold);
householdsRouter.post("/", validate(householdSchema), controller.createHousehold);
householdsRouter.patch("/:id", validate(householdSchema.partial()), controller.updateHousehold);

// Guardian Context Nested Tree Sub-routes
householdsRouter.post("/:id/guardians", validate(guardianSchema), controller.addGuardian);
householdsRouter.patch("/:id/guardians/:guardianId", validate(guardianSchema.partial()), controller.updateGuardian);
householdsRouter.delete("/:id/guardians/:guardianId", controller.deleteGuardian);

export default householdsRouter;
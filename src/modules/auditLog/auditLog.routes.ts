// routes/auditLog.routes.ts
import { Router } from 'express';

import auditLogController from './auditLog.controller.js';
// Updated imports to match your actual middleware function names
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { UserRole } from '@prisma/client';

const LogAuditrouter = Router();

// Apply authentication to all routes
LogAuditrouter.use(authenticate);

// Define allowed roles using your Prisma Enum
const auditRoles = [
  UserRole.ADMIN, 
  UserRole.COUNTRY_DIRECTOR, 
  UserRole.PROGRAM_MANAGER, 
  UserRole.SOCIAL_WORKER, 
  UserRole.EDUCATION_OFFICER, 
  UserRole.FINANCE_OFFICER,
  UserRole.HEALTH_OFFICER,
  UserRole.PSYCHOSOCIAL_OFFICER
];
 

// Routes
// Using authorize middleware to check against the provided roles
LogAuditrouter.get("/", authorize(...auditRoles), auditLogController.list);
LogAuditrouter.get("/resources", authorize(...auditRoles), auditLogController.resources);
LogAuditrouter.get("/actions", authorize(...auditRoles), auditLogController.actions);
LogAuditrouter.get("/users/:userId/activity", authorize(...auditRoles), auditLogController.userActivity);
LogAuditrouter.get("/:id", authorize(...auditRoles), auditLogController.getOne);

export default LogAuditrouter;
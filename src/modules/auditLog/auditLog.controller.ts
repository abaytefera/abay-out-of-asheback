// controllers/auditLog.controller.ts
import { Request, Response, NextFunction } from 'express';
import * as auditLogService from './auditLog.service.js';

import { sendSuccess } from '../../utils/response.js'; // Updated import

/**
 * Audit Log Controller
 * Handles incoming HTTP requests and delegates business logic to the service layer.
 */

const auditLogController = {
  
  /**
   * GET /api/audit-logs
   */
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await auditLogService.listLogs(req.query as any, (req as any).user);
      // Use sendSuccess with the meta property if your service returns it
      return sendSuccess(res, result.data, "Logs retrieved successfully", 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/audit-logs/resources
   */
  resources: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const resources = await auditLogService.getResources();
      return sendSuccess(res, resources, "Resources retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/audit-logs/actions
   */
  actions: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const actions = await auditLogService.getActions();
      return sendSuccess(res, actions, "Actions retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/audit-logs/:id
   */
  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const log = await auditLogService.getLog(req.params.id, (req as any).user);
      return sendSuccess(res, log, "Log retrieved successfully");
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/audit-logs/users/:userId/activity
   */
  userActivity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activity = await auditLogService.getUserActivity(
        req.params.userId, 
        Number(req.query.days) || 30, 
        (req as any).user
      );
      return sendSuccess(res, activity, "User activity retrieved successfully");
    } catch (error) {
      next(error);
    }
  }
};

export default auditLogController;
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
export declare function handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function listWebhooks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function createWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function deleteWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function regenerateWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=webhook.controller.d.ts.map
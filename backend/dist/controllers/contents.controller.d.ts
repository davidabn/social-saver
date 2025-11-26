import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
export declare function listContents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function getContent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function createContent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function deleteContent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=contents.controller.d.ts.map
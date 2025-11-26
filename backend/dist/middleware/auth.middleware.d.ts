import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
export declare function authMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map
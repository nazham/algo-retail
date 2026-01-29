import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { auth } from './auth.config';

/**
 * Tenant Context Middleware
 * Extracts tenant ID from user session and injects it into request
 * For MVP: Single tenant operation, but structure is ready for multi-tenant
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Get session from Better-Auth
      const session = await auth.api.getSession({
        headers: req.headers as any,
      });

      if (session?.user) {
        // Inject user and tenant context into request
        req['user'] = session.user;

        // For MVP: Use first tenant ID or default
        // In production multi-tenant: tenant switching logic here
        const tenantIds = (session.user as any).tenantIds || [];
        req['tenantId'] = tenantIds[0] || process.env.DEFAULT_TENANT_ID;
      }
    } catch (error) {
      // No session or invalid session - continue without tenant context
      // Protected routes should check for req['user'] existence
    }

    next();
  }
}

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

        // Extract tenant ID from user session
        const user = session.user as any;
        const tenantId = user.tenantId || process.env.DEFAULT_TENANT_ID;

        req['tenantId'] = tenantId;
      } else {
        // No session user, but might be API Key access
      }
    } catch (error) {
      console.error('[Middleware] Error fetching session:', error);
    }

    // Fallback: If no tenant from session, check headers (For Desktop POS / API Key)
    if (!req['tenantId'] && req.headers['x-tenant-id']) {
      req['tenantId'] = req.headers['x-tenant-id'];
    }

    next();
  }
}

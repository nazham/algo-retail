import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class UniversalAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Session Authentication (High Priority for Web Admin)
    // TenantContextMiddleware runs before this and attaches 'user' if session is valid
    if (request['user']) {
      return true;
    }

    // 2. API Key Authentication (Fallback for POS / Scripts)
    const apiKey = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('API_SECRET_KEY');

    if (!validKey) {
      console.error('API_SECRET_KEY is not set');
      // If no session and no config, stricter security implies we fail
      throw new UnauthorizedException('Internal Server Error: Config missing');
    }

    if (apiKey && apiKey.length === validKey.length) {
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(apiKey),
        Buffer.from(validKey),
      );
      if (isMatch) return true;
    }

    // 3. Fail if neither is present
    throw new UnauthorizedException(
      'Authentication required (Session or API Key)',
    );
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class SuperadminGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Allow bypass if valid Master API Key is provided
    const apiKey = request.headers['x-api-key'];
    const validKey = this.configService.get<string>('API_SECRET_KEY');

    if (apiKey && validKey && apiKey.length === validKey.length) {
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(apiKey),
        Buffer.from(validKey),
      );
      if (isMatch) return true;
    }

    // 2. Otherwise, check session user role
    const user = request.user;

    if (!user || user.role !== 'superadmin') {
      throw new ForbiddenException(
        'Only super admins are allowed to perform this action.',
      );
    }

    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Look for the key in the headers
    const apiKey = request.headers['x-api-key'];

    // 2. Get the valid key from .env
    const validKey = this.configService.get<string>('API_SECRET_KEY');

    if (!validKey) {
      console.error('API_SECRET_KEY is not set');
      throw new UnauthorizedException('Internal Server Error: Config missing');
    }

    // 3. Compare (Constant time comparison to prevent timing attacks)
    if (apiKey && apiKey.length === validKey.length) {
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(apiKey),
        Buffer.from(validKey),
      );
      if (isMatch) return true;
    }

    // 4. Reject if missing or wrong
    throw new UnauthorizedException('Invalid or missing API Key');
  }
}

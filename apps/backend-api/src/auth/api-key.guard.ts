import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // 1. Look for the key in the headers
    const apiKey = request.headers['x-api-key'];

    // 2. Get the valid key from .env
    const validKey = this.configService.get<string>('API_SECRET_KEY');

    // 3. Compare (Safe string comparison recommended, but strict equality is fine for MVP)
    if (apiKey && apiKey === validKey) {
      return true; // Door opens
    }

    // 4. Reject if missing or wrong
    throw new UnauthorizedException('Invalid or missing API Key');
  }
}

import { Controller, All, Req, Res } from '@nestjs/common';
import { auth } from './auth.config'; // Unified auth config
import { toNodeHandler } from 'better-auth/node';

@Controller('api/auth')
export class AuthController {
  @All('*')
  async handleAuth(@Req() req, @Res() res) {
    // 🔌 The Bridge: Hand over NestJS request to Better Auth
    const handler = toNodeHandler(auth);
    return handler(req, res);
  }
}

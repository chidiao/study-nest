import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImService } from './im.service';

interface AuthenticatedUser {
  id: number;
}

@Controller('im')
@UseGuards(JwtAuthGuard)
export class ImController {
  constructor(private readonly imService: ImService) {}

  @Get('usersig')
  getUserSig(@Req() req: { user: AuthenticatedUser }) {
    return this.imService.generateUserSig(String(req.user.id));
  }
}

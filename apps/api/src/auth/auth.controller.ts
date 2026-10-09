import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login/bigc')
  loginBigc(@Body() body: { email: string; password: string }) {
    return this.auth.loginBigcUser(body.email, body.password);
  }

  @Post('login/supplier')
  loginSupplier(@Body() body: { email: string; password: string }) {
    return this.auth.loginSupplier(body.email, body.password);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() req: any, @Body() body: { newPassword: string }) {
    return this.auth.changeSupplierPassword(req.user.id, body.newPassword);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() req: any) {
    return this.auth.getProfile(req.user.id, req.user.type);
  }
}

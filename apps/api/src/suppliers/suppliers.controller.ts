import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private service: SuppliersService) {}

  @Get()
  @Roles('ADMIN', 'EDITOR', 'GCP')
  findAll(@Query() query: { status?: string; search?: string }) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'EDITOR', 'GCP')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN', 'EDITOR')
  create(@Body() body: any, @Req() req: any) {
    // Accept both `email`/`phone` (frontend) and `contactEmail`/`contactPhone` (direct API)
    const dto = {
      ...body,
      contactEmail: body.contactEmail || body.email,
      contactPhone: body.contactPhone || body.phone,
    };
    return this.service.create(dto, req.user.id);
  }

  @Post('bulk')
  @Roles('ADMIN')
  bulkCreate(@Body() body: { rows: any[] }, @Req() req: any) {
    return this.service.bulkCreate(body.rows, req.user.id);
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN', 'EDITOR')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Patch(':id/reactivate')
  @Roles('ADMIN', 'EDITOR')
  reactivate(@Param('id') id: string) {
    return this.service.reactivate(id);
  }

  @Post(':id/resend-password')
  @Roles('ADMIN', 'EDITOR')
  resendPassword(@Param('id') id: string) {
    return this.service.resendPassword(id);
  }
}

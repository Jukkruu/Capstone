import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, Optional } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles, RolesGuard } from '../auth/roles.guard';

@Controller('equipment')
export class EquipmentController {
  constructor(private service: EquipmentService) {}

  // Public: vendor nominee submits without login
  @Post('public-submit')
  publicSubmit(@Body() body: any) {
    return this.service.publicSubmit(body);
  }

  // All authenticated users can list (filtered by role in service)
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: any, @Req() req: any) {
    return this.service.findAll(req.user, query);
  }

  // Compare multiple assets side-by-side
  @Get('compare')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GCP', 'ADMIN')
  compare(@Query('ids') ids: string) {
    return this.service.compare(ids.split(','));
  }

  // Export data
  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GCP', 'ADMIN')
  export(@Query() query: any, @Req() req: any) {
    return this.service.exportData(query, req.user);
  }

  // Sync monitor stats
  @Get('sync-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR', 'GCP')
  syncStats() {
    return this.service.syncStats();
  }

  // Single record
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.service.findOne(id, req.user);
  }

  // Update / enrich (GCP, ADMIN, SUPPLIER own records)
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.update(id, body, req.user);
  }

  // GCP approve
  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GCP', 'ADMIN')
  approve(@Param('id') id: string, @Req() req: any) {
    return this.service.approve(id, req.user);
  }

  // GCP reject / return to vendor
  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GCP', 'ADMIN')
  reject(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    return this.service.reject(id, body.reason, req.user);
  }

  // GCP nominate winner
  @Post(':id/nominate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GCP', 'ADMIN')
  nominate(@Param('id') id: string, @Req() req: any) {
    return this.service.nominate(id, req.user);
  }

  // Queue for batch sync (ERMA flow)
  @Post(':id/queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPPLIER', 'ADMIN')
  queue(@Param('id') id: string) {
    return this.service.setQueued(id);
  }

  // Deactivate
  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'EDITOR')
  deactivate(@Param('id') id: string, @Req() req: any) {
    return this.service.deactivate(id, req.user);
  }

  // Mock batch sync trigger
  @Post('batch/sync-cms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  syncCms() {
    return this.service.runBatchSync('CMS');
  }

  @Post('batch/sync-fa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  syncFa() {
    return this.service.runBatchSync('FIXED_ASSET');
  }
}

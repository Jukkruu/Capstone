import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordStatus, SubmissionStatus, AuditAction } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  // ── Public: vendor nominee submits without login ──────────────────────────
  async publicSubmit(dto: any) {
    const tco = this.calcTco(dto);
    const carbon = this.calcCarbon(dto);

    const equipment = await this.prisma.equipment.create({
      data: {
        nameEn: dto.nameEn || dto.nameTh || 'Unnamed Asset',
        nameTh: dto.nameTh,
        category: dto.category,
        subCategory: dto.subCategory,
        brand: dto.brand,
        model: dto.model,
        serialNo: dto.serialNo,
        countryOfOrigin: dto.countryOfOrigin,
        productSeries: dto.productSeries,
        mfgDate: dto.mfgDate,
        capacity: dto.capacity,
        powerRequirement: dto.powerRequirement,
        utilityRequirement: dto.utilityRequirement,
        dimensions: dto.dimensions,
        operatingCondition: dto.operatingCondition,
        standards: dto.standards,
        functionalReqs: dto.functionalReqs,
        shortSpec: dto.shortSpec,
        usefulLifeYr: dto.usefulLifeYr ? Number(dto.usefulLifeYr) : undefined,
        economicLifeYr: dto.economicLifeYr ? Number(dto.economicLifeYr) : undefined,
        designLife: dto.designLife,
        overhaul: dto.overhaul,
        residualValuePct: dto.residualValuePct ? Number(dto.residualValuePct) : undefined,
        endOfSupportYr: dto.endOfSupportYr ? Number(dto.endOfSupportYr) : undefined,
        disposalGuide: dto.disposalGuide,
        hoursPerYear: dto.hoursPerYear ? Number(dto.hoursPerYear) : undefined,
        purchasePrice: dto.purchasePrice ? Number(dto.purchasePrice) : undefined,
        maintCostPerYear: dto.maintCostPerYear ? Number(dto.maintCostPerYear) : undefined,
        pmPackagePrice: dto.pmPackagePrice,
        consumableCostPerYear: dto.consumableCostPerYear ? Number(dto.consumableCostPerYear) : undefined,
        laborRate: dto.laborRate ? Number(dto.laborRate) : undefined,
        energyKwhPerHr: dto.energyKwhPerHr ? Number(dto.energyKwhPerHr) : undefined,
        priceEscalationPct: dto.priceEscalationPct ? Number(dto.priceEscalationPct) : undefined,
        tcoTotal: tco ?? undefined,
        emissionFactor: dto.emissionFactor ? Number(dto.emissionFactor) : undefined,
        carbonCreditPrice: dto.carbonCreditPrice ? Number(dto.carbonCreditPrice) : undefined,
        co2PerYear: carbon?.co2PerYear ?? undefined,
        co2Lifetime: carbon?.co2Lifetime ?? undefined,
        carbonCreditValue: carbon?.carbonCreditValue ?? undefined,
        submissionStatus: SubmissionStatus.SUBMITTED,
        recordStatus: RecordStatus.DRAFT,
        // Supplier link by email if provided
        ...(dto.supplierEmail && {
          supplier: { connect: { contactEmail: dto.supplierEmail } },
        }),
      },
    });

    // Create warranty record if provided
    if (dto.warrantyStart || dto.warrantyEnd || dto.slaResponseHr) {
      await this.prisma.warranty.create({
        data: {
          equipmentId: equipment.id,
          warrantyStart: dto.warrantyStart ? new Date(dto.warrantyStart) : undefined,
          warrantyEnd: dto.warrantyEnd ? new Date(dto.warrantyEnd) : undefined,
          warrantyScope: dto.warrantyScope,
          warrantyCondition: dto.warrantyCondition,
          extendedWarrantyOption: dto.extendedWarrantyOption,
          slaResponseHr: dto.slaResponseHr ? Number(dto.slaResponseHr) : undefined,
          slaRestoreHr: dto.slaRestoreHr ? Number(dto.slaRestoreHr) : undefined,
          serviceCenter: dto.serviceCenter,
          training: dto.training,
        },
      });
    }

    return { id: equipment.id, status: equipment.submissionStatus };
  }

  // ── List: filtered by role ────────────────────────────────────────────────
  async findAll(user: any, query: any) {
    const where: any = {};

    if (query.status) where.submissionStatus = query.status;
    if (query.recordStatus) where.recordStatus = query.recordStatus;
    if (query.category) where.category = { contains: query.category, mode: 'insensitive' };
    if (query.search) {
      where.OR = [
        { nameEn: { contains: query.search, mode: 'insensitive' } },
        { nameTh: { contains: query.search, mode: 'insensitive' } },
        { tagNumber: { contains: query.search, mode: 'insensitive' } },
        { brand: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // SUPPLIER sees only their own equipment
    if (user.type === 'supplier') {
      const sup = await this.prisma.supplier.findUnique({ where: { id: user.id } });
      if (!sup) throw new ForbiddenException();
      where.supplierId = sup.id;
    }

    // USER scoped by department category (simplified: filter by category list)
    if (user.role === 'USER' && query.categories) {
      const cats = String(query.categories).split(',');
      where.category = { in: cats };
    }

    return this.prisma.equipment.findMany({
      where,
      select: {
        id: true, assetCode: true, tagNumber: true, nameEn: true, nameTh: true,
        category: true, subCategory: true, brand: true, model: true,
        submissionStatus: true, recordStatus: true, createdAt: true, updatedAt: true,
        supplier: { select: { name: true, supplierCode: true } },
        location: { select: { storeCode: true, buildingZone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ? Number(query.limit) : 50,
      skip: query.offset ? Number(query.offset) : 0,
    });
  }

  // ── Single record ─────────────────────────────────────────────────────────
  async findOne(id: string, user: any) {
    const eq = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, supplierCode: true, contactEmail: true } },
        location: true,
        assetType: true,
        serviceType: true,
        warranty: true,
        bom: { include: { part: true } },
        spareParts: true,
        documents: true,
        syncLogs: { orderBy: { runAt: 'desc' }, take: 10 },
      },
    });
    if (!eq) throw new NotFoundException('Equipment not found');
    if (user?.type === 'supplier' && eq.supplier?.id !== user.id) throw new ForbiddenException();
    return eq;
  }

  // ── GCP / Admin: update / enrich ─────────────────────────────────────────
  async update(id: string, dto: any, user: any) {
    const existing = await this.findOne(id, user);
    const tco = this.calcTco({ ...existing, ...dto });
    const carbon = this.calcCarbon({ ...existing, ...dto });

    const updated = await this.prisma.equipment.update({
      where: { id },
      data: {
        ...this.sanitizeUpdate(dto),
        tcoTotal: tco ?? undefined,
        co2PerYear: carbon?.co2PerYear ?? undefined,
        co2Lifetime: carbon?.co2Lifetime ?? undefined,
        carbonCreditValue: carbon?.carbonCreditValue ?? undefined,
        updatedBy: user.email,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        equipmentId: id,
        userId: user.type === 'bigc' ? user.id : undefined,
        supplierId: user.type === 'supplier' ? user.id : undefined,
        action: AuditAction.UPDATE,
        oldValue: existing as any,
        newValue: dto,
      },
    });

    return updated;
  }

  // ── Status transitions ────────────────────────────────────────────────────
  async approve(id: string, user: any) {
    return this.transition(id, SubmissionStatus.APPROVED, user, AuditAction.APPROVE);
  }

  async reject(id: string, reason: string, user: any) {
    const eq = await this.prisma.equipment.update({
      where: { id },
      data: {
        submissionStatus: SubmissionStatus.REJECTED,
        returnReason: reason,
        returnedAt: new Date(),
        returnedBy: user.email,
        updatedBy: user.email,
      },
    });
    await this.logAudit(id, user, AuditAction.REJECT, { reason });
    return eq;
  }

  async nominate(id: string, user: any) {
    const eq = await this.prisma.equipment.update({
      where: { id },
      data: {
        submissionStatus: SubmissionStatus.NOMINATED,
        nominatedAt: new Date(),
        nominatedBy: user.email,
        updatedBy: user.email,
      },
    });
    await this.logAudit(id, user, AuditAction.NOMINATE, {});
    return eq;
  }

  async setQueued(id: string) {
    return this.prisma.equipment.update({
      where: { id },
      data: { recordStatus: RecordStatus.QUEUED },
    });
  }

  async deactivate(id: string, user: any) {
    const eq = await this.prisma.equipment.update({
      where: { id },
      data: { recordStatus: RecordStatus.INACTIVE, updatedBy: user.email },
    });
    await this.logAudit(id, user, AuditAction.DEACTIVATE, {});
    return eq;
  }

  // ── Compare (side-by-side) ────────────────────────────────────────────────
  async compare(ids: string[]) {
    return this.prisma.equipment.findMany({
      where: { id: { in: ids } },
      include: { warranty: true, supplier: { select: { name: true } } },
    });
  }

  // ── Export CSV data ───────────────────────────────────────────────────────
  async exportData(query: any, user: any) {
    const items = await this.findAll(user, { ...query, limit: 10000 });
    return items;
  }

  // ── Sync log for monitor screen ───────────────────────────────────────────
  async syncStats() {
    const [synced, queued, failed, total] = await Promise.all([
      this.prisma.equipment.count({ where: { recordStatus: RecordStatus.SYNCED } }),
      this.prisma.equipment.count({ where: { recordStatus: RecordStatus.QUEUED } }),
      this.prisma.equipment.count({ where: { recordStatus: RecordStatus.SYNC_FAILED } }),
      this.prisma.equipment.count(),
    ]);
    const recentLogs = await this.prisma.syncLog.findMany({
      orderBy: { runAt: 'desc' },
      take: 50,
      include: { equipment: { select: { tagNumber: true, nameEn: true } } },
    });
    return { synced, queued, failed, total, recentLogs };
  }

  // ── Mock batch sync (simulated) ───────────────────────────────────────────
  async runBatchSync(target: 'CMS' | 'FIXED_ASSET') {
    const batchRunId = crypto.randomUUID();
    const queued = await this.prisma.equipment.findMany({
      where: { recordStatus: RecordStatus.QUEUED },
      select: { id: true },
    });

    for (const eq of queued) {
      const success = Math.random() > 0.1; // 90% success rate mock
      await this.prisma.syncLog.create({
        data: {
          batchRunId,
          equipmentId: eq.id,
          targetSystem: target as any,
          direction: 'OUTBOUND',
          status: success ? 'SUCCESS' : 'FAILED',
          errorMessage: success ? null : 'Mock connection timeout',
        },
      });
      if (success) {
        await this.prisma.equipment.update({
          where: { id: eq.id },
          data: {
            recordStatus: RecordStatus.SYNCED,
            ...(target === 'CMS' && { cmsSyncStatus: 'synced' }),
            ...(target === 'FIXED_ASSET' && { faSyncStatus: 'synced' }),
          },
        });
      } else {
        await this.prisma.equipment.update({
          where: { id: eq.id },
          data: { recordStatus: RecordStatus.SYNC_FAILED },
        });
      }
    }

    const synced = queued.length; // approximation before individual results counted
    let failed = 0;
    // Count actual failures from the logs just created
    const failCount = await this.prisma.syncLog.count({ where: { batchRunId, status: 'FAILED' } });
    failed = failCount;
    return { batchRunId, total: queued.length, synced: queued.length - failCount, failed: failCount };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private calcTco(d: any): number | null {
    const price = Number(d.purchasePrice || 0);
    const maint = Number(d.maintCostPerYear || 0);
    const cons = Number(d.consumableCostPerYear || 0);
    const energy = Number(d.energyKwhPerHr || 0);
    const hrs = Number(d.hoursPerYear || 8760);
    const life = Number(d.usefulLifeYr || 0);
    const esc = Number(d.priceEscalationPct || 0) / 100;
    const resid = (Number(d.residualValuePct || 0) / 100) * price;
    const energyCostPerYear = energy * hrs * 4; // assume 4 THB/kWh
    if (!life) return null;
    const opex = (maint + cons + energyCostPerYear) * life * (1 + esc * life / 2);
    return Math.round(price + opex - resid);
  }

  private calcCarbon(d: any) {
    const energy = Number(d.energyKwhPerHr || 0);
    const hrs = Number(d.hoursPerYear || 8760);
    const life = Number(d.usefulLifeYr || 0);
    const ef = Number(d.emissionFactor || 0.4999);
    const cprice = Number(d.carbonCreditPrice || 0);
    if (!energy || !life) return null;
    const co2PerYear = (energy * hrs * ef) / 1000;
    const co2Lifetime = co2PerYear * life;
    const carbonCreditValue = co2Lifetime * cprice;
    return { co2PerYear, co2Lifetime, carbonCreditValue };
  }

  private sanitizeUpdate(dto: any) {
    const allowed = [
      'nameEn', 'nameTh', 'category', 'subCategory', 'brand', 'model', 'serialNo',
      'tagNumber', 'assetCode', 'mtnCode', 'shortSpec', 'fullSpec',
      'company', 'businessUnit', 'branchSiteCode', 'responsiblePerson',
      'costCenter', 'glAccount', 'subAccount', 'wbs', 'contractNo', 'poNo',
      'installDate', 'status', 'criticality', 'warrantyMonths', 'warrantyEndDate',
      'usefulLifeYr', 'economicLifeYr', 'designLife', 'overhaul', 'residualValuePct',
      'endOfSupportYr', 'disposalGuide', 'hoursPerYear',
      'purchasePrice', 'maintCostPerYear', 'pmPackagePrice', 'consumableCostPerYear',
      'laborRate', 'energyKwhPerHr', 'priceEscalationPct',
      'emissionFactor', 'carbonCreditPrice',
      'assetTypeId', 'serviceTypeId', 'locationId', 'recordStatus', 'submissionStatus',
    ];
    return Object.fromEntries(Object.entries(dto).filter(([k]) => allowed.includes(k)));
  }

  private async transition(id: string, status: SubmissionStatus, user: any, action: AuditAction) {
    const eq = await this.prisma.equipment.update({
      where: { id },
      data: { submissionStatus: status, updatedBy: user.email },
    });
    await this.logAudit(id, user, action, { status });
    return eq;
  }

  private async logAudit(equipmentId: string, user: any, action: AuditAction, newValue: any) {
    await this.prisma.auditLog.create({
      data: {
        equipmentId,
        userId: user.type === 'bigc' ? user.id : undefined,
        supplierId: user.type === 'supplier' ? user.id : undefined,
        action,
        newValue,
      },
    });
  }
}

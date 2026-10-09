import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubmissionStatus, RecordStatus } from '@prisma/client';
import { calcTco, calcCarbon } from '@/lib/equipment-calc';

export async function POST(req: NextRequest) {
  const dto = await req.json();
  const tco = calcTco(dto);
  const carbon = calcCarbon(dto);

  const equipment = await prisma.equipment.create({
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
      ...(dto.supplierEmail && {
        supplier: { connect: { contactEmail: dto.supplierEmail } },
      }),
    },
  });

  if (dto.warrantyStart || dto.warrantyEnd || dto.slaResponseHr) {
    await prisma.warranty.create({
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

  return NextResponse.json({ id: equipment.id, status: equipment.submissionStatus });
}

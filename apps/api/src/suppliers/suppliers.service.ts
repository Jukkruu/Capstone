import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationType, SupplierStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { status?: string; search?: string }) {
    return this.prisma.supplier.findMany({
      where: {
        ...(query.status && { accountStatus: query.status as SupplierStatus }),
        ...(query.search && {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { contactEmail: { contains: query.search, mode: 'insensitive' } },
            { taxId: { contains: query.search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true, supplierCode: true, name: true, contactEmail: true,
        contactPhone: true, accountStatus: true, registrationType: true,
        registeredAt: true, leadTimeDays: true,
        registeredBy: { select: { displayName: true } },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const s = await this.prisma.supplier.findUnique({
      where: { id },
      select: {
        id: true, supplierCode: true, name: true, taxId: true,
        contactEmail: true, contactPhone: true, address: true,
        leadTimeDays: true, contractPrice: true, accountStatus: true,
        mustChangePassword: true, registrationType: true, registeredAt: true,
        registeredBy: { select: { displayName: true, email: true } },
        _count: { select: { equipment: true } },
      },
    });
    if (!s) throw new NotFoundException('Supplier not found');
    return s;
  }

  async create(dto: any, registeredById: string) {
    const exists = await this.prisma.supplier.findFirst({
      where: { OR: [{ contactEmail: dto.contactEmail }, ...(dto.taxId ? [{ taxId: dto.taxId }] : [])] },
    });
    if (exists) throw new ConflictException('Email or Tax ID already registered');

    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const count = await this.prisma.supplier.count();
    const supplierCode = `SUP-${String(count + 1).padStart(5, '0')}`;

    const supplier = await this.prisma.supplier.create({
      data: {
        supplierCode,
        name: dto.name,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        taxId: dto.taxId || undefined,
        address: dto.address,
        leadTimeDays: dto.leadTimeDays,
        passwordHash,
        registrationType: dto.registrationType || RegistrationType.SINGLE,
        registeredById,
      },
      select: { id: true, supplierCode: true, name: true, contactEmail: true },
    });

    // In production: send email with tempPassword
    return { ...supplier, tempPassword };
  }

  async bulkCreate(rows: any[], registeredById: string) {
    const results = { created: [] as any[], errors: [] as any[] };
    for (const row of rows) {
      try {
        const s = await this.create({ ...row, registrationType: RegistrationType.BULK }, registeredById);
        results.created.push(s);
      } catch (e: any) {
        results.errors.push({ row, error: e.message });
      }
    }
    return results;
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: { accountStatus: SupplierStatus.INACTIVE },
      select: { id: true, accountStatus: true },
    });
  }

  async reactivate(id: string) {
    await this.findOne(id);
    return this.prisma.supplier.update({
      where: { id },
      data: { accountStatus: SupplierStatus.ACTIVE },
      select: { id: true, accountStatus: true },
    });
  }

  async resendPassword(id: string) {
    const supplier = await this.findOne(id);
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    await this.prisma.supplier.update({
      where: { id },
      data: { passwordHash, mustChangePassword: true },
    });
    // In production: send email
    return { email: supplier.contactEmail, tempPassword };
  }
}

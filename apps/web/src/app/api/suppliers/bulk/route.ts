import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RegistrationType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { rows } = await req.json();
  const results: { created: any[]; errors: any[] } = { created: [], errors: [] };

  for (const row of rows) {
    try {
      const dto = { ...row, contactEmail: row.contactEmail || row.email, contactPhone: row.contactPhone || row.phone };
      const exists = await prisma.supplier.findFirst({
        where: { OR: [{ contactEmail: dto.contactEmail }, ...(dto.taxId ? [{ taxId: dto.taxId }] : [])] },
      });
      if (exists) throw new Error('Email or Tax ID already registered');

      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      const passwordHash = await bcrypt.hash(tempPassword, 10);
      const count = await prisma.supplier.count();
      const supplierCode = `SUP-${String(count + 1).padStart(5, '0')}`;

      const supplier = await prisma.supplier.create({
        data: {
          supplierCode, name: dto.name, contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone, taxId: dto.taxId || undefined,
          address: dto.address, leadTimeDays: dto.leadTimeDays,
          passwordHash, registrationType: RegistrationType.BULK, registeredById: user.id,
        },
        select: { id: true, supplierCode: true, name: true, contactEmail: true },
      });
      results.created.push({ ...supplier, tempPassword });
    } catch (e: any) {
      results.errors.push({ row, error: e.message });
    }
  }
  return NextResponse.json(results);
}

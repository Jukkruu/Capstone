import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (!['ADMIN', 'EDITOR'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supplier = await prisma.supplier.findUnique({ where: { id: params.id } });
  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.supplier.update({
    where: { id: params.id },
    data: { passwordHash, mustChangePassword: true },
  });
  return NextResponse.json({ email: supplier.contactEmail, tempPassword });
}

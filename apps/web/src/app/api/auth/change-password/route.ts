import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as any;
  if (user.type !== 'supplier') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { newPassword } = await req.json();
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.supplier.update({
    where: { id: user.id },
    data: { passwordHash: hash, mustChangePassword: false },
  });
  return NextResponse.json({ ok: true });
}

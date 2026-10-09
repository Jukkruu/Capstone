import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RecordStatus } from '@prisma/client';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [synced, queued, failed, total] = await Promise.all([
    prisma.equipment.count({ where: { recordStatus: RecordStatus.SYNCED } }),
    prisma.equipment.count({ where: { recordStatus: RecordStatus.QUEUED } }),
    prisma.equipment.count({ where: { recordStatus: RecordStatus.SYNC_FAILED } }),
    prisma.equipment.count(),
  ]);
  const recentLogs = await prisma.syncLog.findMany({
    orderBy: { runAt: 'desc' },
    take: 50,
    include: { equipment: { select: { tagNumber: true, nameEn: true } } },
  });
  return NextResponse.json({ synced, queued, failed, total, recentLogs });
}

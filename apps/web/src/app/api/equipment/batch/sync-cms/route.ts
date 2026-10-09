import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RecordStatus } from '@prisma/client';

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return runBatchSync('CMS');
}

async function runBatchSync(target: 'CMS' | 'FIXED_ASSET') {
  const batchRunId = crypto.randomUUID();
  const queued = await prisma.equipment.findMany({
    where: { recordStatus: RecordStatus.QUEUED },
    select: { id: true },
  });

  for (const eq of queued) {
    const success = Math.random() > 0.1;
    await prisma.syncLog.create({
      data: {
        batchRunId,
        equipmentId: eq.id,
        targetSystem: target as any,
        direction: 'OUTBOUND',
        status: success ? 'SUCCESS' : 'FAILED',
        errorMessage: success ? null : 'Mock connection timeout',
      },
    });
    await prisma.equipment.update({
      where: { id: eq.id },
      data: {
        recordStatus: success ? RecordStatus.SYNCED : RecordStatus.SYNC_FAILED,
        ...(success && target === 'CMS' && { cmsSyncStatus: 'synced' }),
        ...(success && target === 'FIXED_ASSET' && { faSyncStatus: 'synced' }),
      },
    });
  }

  const failCount = await prisma.syncLog.count({ where: { batchRunId, status: 'FAILED' } });
  return NextResponse.json({ batchRunId, total: queued.length, synced: queued.length - failCount, failed: failCount });
}

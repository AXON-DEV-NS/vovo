/**
 * content.ts — Content item service layer.
 *
 * All database interactions for ContentItem are funnelled through these
 * functions, keeping API routes thin and making the audit trail easy to wire.
 */

import { prisma } from '@/lib/db/prisma';
import { writeAuditLog } from './audit';
import { aiEngine } from '@/lib/ai-providers';

// Use string literal type matching Prisma enum until `prisma generate` runs
type ContentStatus = 'IDEA' | 'SCRIPT' | 'GENERATING' | 'READY_FOR_REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'REJECTED';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApprovalAction = 'approve' | 'reject' | 'request_changes';

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Fetch all content items for a user's channels, with optional filters */
export async function getContentItems(params: {
  userId: string;
  channelId?: string;
  status?: ContentStatus;
  from?: Date;
  to?: Date;
}) {
  return prisma.contentItem.findMany({
    where: {
      userId: params.userId,
      ...(params.channelId && { channelId: params.channelId }),
      ...(params.status && { status: params.status }),
      ...(params.from || params.to
        ? {
            scheduledAt: {
              ...(params.from && { gte: params.from }),
              ...(params.to && { lte: params.to }),
            },
          }
        : {}),
    },
    include: {
      channel: { select: { id: true, title: true, thumbnailUrl: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

/** Fetch a single content item — verifies ownership */
export async function getContentItemById(id: string, userId: string) {
  return prisma.contentItem.findFirst({
    where: { id, userId },
    include: {
      channel: { select: { id: true, title: true, thumbnailUrl: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Transition a content item status and record it in the history log */
async function transitionStatus(params: {
  itemId: string;
  fromStatus: ContentStatus;
  toStatus: ContentStatus;
  actor: string;
  comment?: string;
  extraFields?: Partial<{ reviewComment: string; scheduledAt: Date; publishedAt: Date }>;
}) {
  const [updated] = await prisma.$transaction([
    prisma.contentItem.update({
      where: { id: params.itemId },
      data: {
        status: params.toStatus,
        ...(params.extraFields ?? {}),
      },
    }),
    prisma.contentStatusEvent.create({
      data: {
        contentItemId: params.itemId,
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        actor: params.actor,
        comment: params.comment,
      },
    }),
  ]);
  return updated;
}

/**
 * Handle a client review action (approve / reject / request_changes).
 * Validates that the item is in READY_FOR_REVIEW state before transitioning.
 */
export async function applyReviewAction(params: {
  itemId: string;
  userId: string;
  action: ApprovalAction;
  comment?: string;
}) {
  const item = await prisma.contentItem.findFirst({
    where: { id: params.itemId, userId: params.userId },
  });

  if (!item) throw new Error('NOT_FOUND');
  if (item.status !== 'READY_FOR_REVIEW') {
    throw new Error(`INVALID_STATE:${item.status}`);
  }

  const statusMap: Record<ApprovalAction, ContentStatus> = {
    approve: 'SCHEDULED',
    reject: 'REJECTED',
    request_changes: 'SCRIPT',
  };

  const toStatus = statusMap[params.action];

  const updated = await transitionStatus({
    itemId: params.itemId,
    fromStatus: 'READY_FOR_REVIEW',
    toStatus,
    actor: params.userId,
    comment: params.comment,
    extraFields:
      params.action === 'request_changes'
        ? { reviewComment: params.comment ?? '' }
        : undefined,
  });

  await writeAuditLog({
    action: `content.${params.action === 'request_changes' ? 'changes_requested' : params.action}d` as never,
    actorId: params.userId,
    targetUserId: params.userId,
    metadata: { itemId: params.itemId, toStatus },
  });

}

/** Create a new content item (typically called by the AI agent) */
export async function createContentItem(data: {
  channelId: string;
  userId: string;
  title: string;
  scheduledAt?: Date;
}) {
  const item = await prisma.contentItem.create({
    data: {
      channelId: data.channelId,
      userId: data.userId,
      title: data.title,
      status: 'IDEA',
      scheduledAt: data.scheduledAt,
    },
  });

  await prisma.contentStatusEvent.create({
    data: {
      contentItemId: item.id,
      fromStatus: null,
      toStatus: 'IDEA',
      actor: 'system',
    },
  });

  return item;
}

/**
 * Advance a content item through its actual AI generation pipeline lifecycle:
 * idea → script → generating → ready_for_review
 */
export async function advanceContentItemPipeline(itemId: string, userId: string) {
  const item = await prisma.contentItem.findFirst({
    where: { id: itemId, userId },
    include: { channel: true },
  });

  if (!item) throw new Error('NOT_FOUND');

  if (item.status === 'IDEA') {
    // DeepSeek is the production brain: it writes the script, the Higgsfield
    // visual prompts, and the ElevenLabs voice directions — constrained by
    // the shared niche memory (proven patterns + forbidden pitfalls).
    const { generateVideoPlan } = await import('@/lib/ai-providers/deepseek');
    const { loadNicheMemory } = await import('@/lib/niche/memory');

    const niche = item.channel.niche || 'General';
    const memory = await loadNicheMemory(niche);
    const plan = await generateVideoPlan({
      title: item.title,
      niche,
      language: /[\u0600-\u06FF]/.test(item.title) ? 'ar' : 'en',
      memory,
    });

    const scriptText = plan.segments
      .map((s, i) => `[Scene ${i + 1} | ${s.durationSeconds}s]\n${s.narration}`)
      .join('\n\n');

    // Mandatory YouTube compliance gate — nothing advances before approval.
    const { reviewYouTubeCompliance } = await import('@/lib/compliance/youtube-rules');
    const compliance = await reviewYouTubeCompliance({
      title: plan.title,
      description: plan.description,
      tags: plan.tags,
      thumbnailPrompt: plan.thumbnailPrompt,
      visualPrompts: plan.segments.map((s) => s.visualPrompt),
      scriptText,
    });

    const planPayload = {
      ...plan,
      compliance: {
        decision: compliance.decision,
        violations: compliance.violations,
        requiredFixes: compliance.requiredFixes,
        checkedAt: new Date().toISOString(),
      },
    };

    const updated = await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        scriptText,
        productionPlan: JSON.parse(JSON.stringify(planPayload)),
        status: compliance.decision === 'APPROVE' ? 'SCRIPT' : item.status,
        reviewComment:
          compliance.decision === 'APPROVE'
            ? null
            : [...compliance.requiredFixes, ...compliance.violations.map((v) => `${v.rule}: ${v.detail}`)]
                .slice(0, 6)
                .join(' • '),
      },
    });

    await prisma.contentStatusEvent.create({
      data: {
        contentItemId: item.id,
        fromStatus: 'IDEA',
        toStatus: compliance.decision === 'APPROVE' ? 'SCRIPT' : item.status,
        actor: 'ai_agent',
        comment:
          compliance.decision === 'APPROVE'
            ? `Production plan generated by DeepSeek (${plan.segments.length} scenes) — YouTube compliance APPROVED`
            : `YouTube compliance REJECTED — ${compliance.violations.length} violation(s)`,
      },
    });

    await writeAuditLog({
      action: 'content.status_changed',
      actorId: 'ai_agent',
      actorRole: 'system',
      targetUserId: userId,
      metadata: {
        itemId,
        fromStatus: 'IDEA',
        toStatus: compliance.decision === 'APPROVE' ? 'SCRIPT' : item.status,
        provider: 'deepseek',
        compliance: compliance.decision,
      },
    });

    if (compliance.decision !== 'APPROVE') {
      throw new Error(
        `COMPLIANCE_REJECTED: ${
          compliance.requiredFixes.join(' • ') ||
          compliance.violations.map((v) => v.rule).join(' • ') ||
          'Content violates YouTube policies.'
        }`
      );
    }

    return updated;
  }

  if (item.status === 'SCRIPT' || item.status === 'GENERATING') {
    // Hard gate: assets are never produced for content that failed compliance.
    const plan = item.productionPlan as
      | { compliance?: { decision?: string } }
      | null;
    if (!plan?.compliance || plan.compliance.decision !== 'APPROVE') {
      throw new Error('COMPLIANCE_REQUIRED');
    }

    // Generate Video & Thumbnail using AI provider engine
    const [videoRes, thumbRes] = await Promise.all([
      aiEngine.generateVideo({ scriptText: item.scriptText || item.title }),
      aiEngine.generateThumbnail({ title: item.title, niche: item.channel.niche || 'General' }),
    ]);

    const updated = await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        mediaUrls: [thumbRes.thumbnailUrl, videoRes.videoUrl],
        status: 'READY_FOR_REVIEW',
      },
    });

    await prisma.contentStatusEvent.create({
      data: {
        contentItemId: item.id,
        fromStatus: item.status,
        toStatus: 'READY_FOR_REVIEW',
        actor: 'ai_agent',
        comment: `Assets generated via ${videoRes.provider}`,
      },
    });

    await writeAuditLog({
      action: 'content.status_changed',
      actorId: 'ai_agent',
      actorRole: 'system',
      targetUserId: userId,
      metadata: { itemId, fromStatus: item.status, toStatus: 'READY_FOR_REVIEW' },
    });

    return updated;
  }

  return item;
}


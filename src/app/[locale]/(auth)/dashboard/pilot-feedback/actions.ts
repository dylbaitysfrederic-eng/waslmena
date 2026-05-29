'use server';

import { auth } from '@clerk/nextjs/server';
import { and, count, eq, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/libs/DB';
import { betaFeedbackSchema } from '@/models/Schema';
import {
  BETA_FEEDBACK_CATEGORIES,
  BETA_FEEDBACK_SEVERITIES,
  normalizeBetaFeedbackOption,
  normalizeBetaFeedbackText,
} from '@/utils/BetaFeedback';

const getReturnPath = (formData: FormData) => {
  const returnPath = formData.get('returnPath')?.toString();

  return returnPath?.endsWith('/dashboard/pilot-feedback')
    ? returnPath
    : '/dashboard/pilot-feedback';
};

const BETA_FEEDBACK_RATE_LIMIT = {
  maxSubmissions: 5,
  windowMs: 10 * 60 * 1000,
};

const isBetaFeedbackRateLimited = async (input: {
  organizationId: string;
  userId: string | null;
}) => {
  const since = new Date(Date.now() - BETA_FEEDBACK_RATE_LIMIT.windowMs);
  const rateLimitCondition = input.userId
    ? and(
      eq(betaFeedbackSchema.organizationId, input.organizationId),
      eq(betaFeedbackSchema.submittedByUserId, input.userId),
      gte(betaFeedbackSchema.createdAt, since),
    )
    : and(
      eq(betaFeedbackSchema.organizationId, input.organizationId),
      gte(betaFeedbackSchema.createdAt, since),
    );
  const [recentFeedbackCount] = await db
    .select({ count: count() })
    .from(betaFeedbackSchema)
    .where(rateLimitCondition);

  return (recentFeedbackCount?.count ?? 0)
    >= BETA_FEEDBACK_RATE_LIMIT.maxSubmissions;
};

export const submitBetaFeedbackAction = async (formData: FormData) => {
  const { orgId, userId } = await auth();
  const returnPath = getReturnPath(formData);

  if (!orgId) {
    return;
  }

  const message = normalizeBetaFeedbackText(formData.get('message'), 2000);

  if (!message) {
    redirect(`${returnPath}?error=missing_message`);
  }

  if (await isBetaFeedbackRateLimited({ organizationId: orgId, userId })) {
    redirect(`${returnPath}?error=rate_limited`);
  }

  await db.insert(betaFeedbackSchema).values({
    organizationId: orgId,
    submittedByUserId: userId ?? null,
    roleContext: normalizeBetaFeedbackText(formData.get('roleContext'), 120),
    category: normalizeBetaFeedbackOption(
      formData.get('category'),
      BETA_FEEDBACK_CATEGORIES,
      'other',
    ),
    severity: normalizeBetaFeedbackOption(
      formData.get('severity'),
      BETA_FEEDBACK_SEVERITIES,
      'medium',
    ),
    message,
    deviceInfo: normalizeBetaFeedbackText(formData.get('deviceInfo'), 240),
    pageContext: normalizeBetaFeedbackText(formData.get('pageContext'), 240),
  });

  revalidatePath('/dashboard/pilot-feedback');
  redirect(`${returnPath}?submitted=1`);
};

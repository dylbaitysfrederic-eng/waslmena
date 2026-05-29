'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { assertAdmin } from '@/app/admin/_helpers';
import { db } from '@/libs/DB';
import { betaFeedbackSchema } from '@/models/Schema';
import {
  BETA_FEEDBACK_STATUSES,
  normalizeBetaFeedbackOption,
  normalizeBetaFeedbackText,
} from '@/utils/BetaFeedback';

export const updateBetaFeedbackAction = async (formData: FormData) => {
  await assertAdmin();

  const feedbackId = Number.parseInt(
    formData.get('feedbackId')?.toString() ?? '',
    10,
  );

  if (Number.isNaN(feedbackId)) {
    return;
  }

  await db
    .update(betaFeedbackSchema)
    .set({
      status: normalizeBetaFeedbackOption(
        formData.get('status'),
        BETA_FEEDBACK_STATUSES,
        'reviewed',
      ),
      adminNotes: normalizeBetaFeedbackText(formData.get('adminNotes'), 2000),
    })
    .where(eq(betaFeedbackSchema.id, feedbackId));

  revalidatePath('/admin/feedback');
  redirect('/admin/feedback?updated=1');
};

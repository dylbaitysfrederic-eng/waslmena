'use server';

import { redirect } from 'next/navigation';

import { sendEmail } from '@/libs/Email';

const WASL_SUPPORT_EMAIL = 'support@waslmena.com';

const normalizeOptionalText = (value: FormDataEntryValue | null) => {
  const textValue = typeof value === 'string' ? value.trim() : '';

  return textValue.length > 0 ? textValue : null;
};

const normalizeReturnPath = (value: FormDataEntryValue | null) => {
  const textValue = normalizeOptionalText(value);

  if (textValue?.startsWith('/') && !textValue.startsWith('//')) {
    return textValue;
  }

  return '/';
};

const isValidEmail = (value: string | null): value is string => {
  if (value === null || value.includes(' ') || value.includes('\n')) {
    return false;
  }

  const [localPart, domainPart, ...extraParts] = value.split('@');

  return Boolean(
    localPart
    && domainPart
    && extraParts.length === 0
    && domainPart.includes('.')
    && !domainPart.startsWith('.')
    && !domainPart.endsWith('.'),
  );
};

export const sendDashboardSupportAction = async (formData: FormData) => {
  const returnPath = normalizeReturnPath(formData.get('returnPath'));
  const subject = normalizeOptionalText(formData.get('subject'));
  const email = normalizeOptionalText(formData.get('email'))?.toLowerCase() ?? null;
  const message = normalizeOptionalText(formData.get('message'));

  if (!subject || !message) {
    redirect(`${returnPath}?support=invalid#support`);
  }

  const replyTo = isValidEmail(email) ? email : undefined;

  try {
    const result = await sendEmail({
      to: WASL_SUPPORT_EMAIL,
      from: WASL_SUPPORT_EMAIL,
      replyTo,
      subject: `Dashboard support: ${subject}`,
      text: [
        'Support message from dashboard',
        '',
        `Reply-to: ${replyTo ?? 'Not provided'}`,
        '',
        'Message:',
        message,
      ].join('\n'),
    });

    if (!result.ok) {
      redirect(`${returnPath}?support=error#support`);
    }

    redirect(`${returnPath}?support=sent#support`);
  } catch {
    redirect(`${returnPath}?support=error#support`);
  }
};

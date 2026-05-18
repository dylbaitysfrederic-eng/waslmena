'use server';

import { redirect } from 'next/navigation';

import { sendEmail } from '@/libs/Email';

const WASL_HELLO_EMAIL = 'hello@waslmena.com';

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

export const sendLandingContactAction = async (formData: FormData) => {
  const returnPath = normalizeReturnPath(formData.get('returnPath'));
  const restaurantName = normalizeOptionalText(formData.get('restaurantName'));
  const contactName = normalizeOptionalText(formData.get('contactName'));
  const email = normalizeOptionalText(formData.get('email'))?.toLowerCase()
    ?? null;
  const whatsapp = normalizeOptionalText(formData.get('whatsapp'));
  const message = normalizeOptionalText(formData.get('message'));

  if (!restaurantName || !contactName || !isValidEmail(email) || !message) {
    redirect(`${returnPath}?contact=invalid#contact`);
  }

  const replyTo = email;

  await sendEmail({
    to: WASL_HELLO_EMAIL,
    replyTo,
    subject: `New Wasl onboarding request: ${restaurantName}`,
    text: [
      'New restaurant/cafe onboarding discussion request.',
      '',
      `Restaurant/cafe: ${restaurantName}`,
      `Contact name: ${contactName}`,
      `Email: ${email}`,
      `WhatsApp: ${whatsapp ?? 'Not provided'}`,
      '',
      'Message:',
      message,
    ].join('\n'),
  });

  redirect(`${returnPath}?contact=sent#contact`);
};

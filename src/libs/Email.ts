import { logger } from './Logger';

export const WASL_SUPPORT_EMAIL = 'support@waslmena.com';

type SendEmailInput = {
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  text: string;
};

type SendEmailResult = {
  ok: boolean;
  provider: 'console' | 'resend';
  messageId?: string;
};

type EmailProvider = {
  send: (input: Required<SendEmailInput>) => Promise<SendEmailResult>;
};

const consoleEmailProvider: EmailProvider = {
  async send(input) {
    const messageId = `console-${Date.now()}`;

    logger.info(
      {
        provider: 'console',
        messageId,
        to: input.to,
        from: input.from,
        replyTo: input.replyTo,
        subject: input.subject,
        text: input.text,
      },
      'Email notification prepared',
    );

    return {
      ok: true,
      provider: 'console',
      messageId,
    };
  },
};

const resendEmailProvider = (apiKey?: string): EmailProvider => ({
  async send(input) {
    const messageId = `resend-${Date.now()}`;

    if (!apiKey) {
      logger.warn({ provider: 'resend' }, 'Resend API key not provided, falling back to console');
      return consoleEmailProvider.send(input);
    }

    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: input.from,
          to: [input.to],
          subject: input.subject,
          text: input.text,
        }),
      });

      let body: any = null;
      try {
        body = await resp.json();
      } catch {
        // ignore
      }

      if (!resp.ok) {
        logger.error(
          {
            provider: 'resend',
            status: resp.status,
            statusText: resp.statusText,
            to: input.to,
            subject: input.subject,
            body,
          },
          'Resend delivery failed',
        );

        return { ok: false, provider: 'resend' };
      }

      logger.info(
        {
          provider: 'resend',
          messageId: body?.id ?? messageId,
          to: input.to,
          subject: input.subject,
        },
        'Email sent via Resend',
      );

      return { ok: true, provider: 'resend', messageId: body?.id ?? messageId };
    } catch (err) {
      logger.error({ provider: 'resend', err }, 'Resend request failed');
      return { ok: false, provider: 'resend' };
    }
  },
});

const getEmailProvider = (): EmailProvider => {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    return resendEmailProvider(key);
  }

  return consoleEmailProvider;
};

const emailProvider = getEmailProvider();

export const sendEmail = async (input: SendEmailInput) => {
  return emailProvider.send({
    ...input,
    from: input.from ?? WASL_SUPPORT_EMAIL,
    replyTo: input.replyTo ?? WASL_SUPPORT_EMAIL,
  });
};

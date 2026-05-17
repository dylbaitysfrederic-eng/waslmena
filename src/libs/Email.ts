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
  provider: 'console';
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

const emailProvider = consoleEmailProvider;

export const sendEmail = async (input: SendEmailInput) => {
  return emailProvider.send({
    ...input,
    from: input.from ?? WASL_SUPPORT_EMAIL,
    replyTo: input.replyTo ?? WASL_SUPPORT_EMAIL,
  });
};

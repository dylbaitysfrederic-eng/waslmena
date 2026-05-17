import { WASL_SUPPORT_EMAIL } from './Email';

type SuspensionEmailInput = {
  restaurantName: string;
  billingRelated: boolean;
};

type SuspensionEmailTemplate = {
  subject: string;
  text: string;
};

const getRestaurantName = (
  locale: 'en' | 'fr' | 'ar',
  restaurantName: string,
) => {
  if (restaurantName !== 'your restaurant') {
    return restaurantName;
  }

  if (locale === 'fr') {
    return 'votre restaurant';
  }

  if (locale === 'ar') {
    return 'مطعمك';
  }

  return restaurantName;
};

const getBillingLine = (locale: 'en' | 'fr' | 'ar', billingRelated: boolean) => {
  if (!billingRelated) {
    return '';
  }

  if (locale === 'fr') {
    return '\nCette suspension peut être liée à un abonnement impayé.';
  }

  if (locale === 'ar') {
    return '\nقد يكون هذا التعليق مرتبطًا باشتراك غير مدفوع.';
  }

  return '\nThis suspension may be related to an unpaid subscription.';
};

export const getSuspensionEmailTemplate = (
  locale: 'en' | 'fr' | 'ar',
  input: SuspensionEmailInput,
): SuspensionEmailTemplate => {
  const restaurantName = getRestaurantName(locale, input.restaurantName);

  if (locale === 'fr') {
    return {
      subject: 'Votre abonnement Wasl a été suspendu',
      text: `Bonjour,

L'accès au compte Wasl de ${restaurantName} a été suspendu.${getBillingLine(locale, input.billingRelated)}

Pour toute question, contactez-nous à ${WASL_SUPPORT_EMAIL}.

L'équipe Wasl`,
    };
  }

  if (locale === 'ar') {
    return {
      subject: 'تم تعليق اشتراك Wasl الخاص بك',
      text: `مرحباً،

تم تعليق الوصول إلى حساب Wasl الخاص بـ ${restaurantName}.${getBillingLine(locale, input.billingRelated)}

لأي سؤال، تواصل معنا على ${WASL_SUPPORT_EMAIL}.

فريق Wasl`,
    };
  }

  return {
    subject: 'Your Wasl subscription has been suspended',
    text: `Hello,

Access to the Wasl account for ${input.restaurantName} has been suspended.${getBillingLine(locale, input.billingRelated)}

For any questions, contact us at ${WASL_SUPPORT_EMAIL}.

The Wasl team`,
  };
};

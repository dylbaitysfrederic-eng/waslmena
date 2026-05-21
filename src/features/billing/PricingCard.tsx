import { useTranslations } from 'next-intl';
import React from 'react';

import type { BillingInterval } from '@/types/Subscription';

export const PricingCard = (props: {
  planId: string;
  price: number;
  interval: BillingInterval;
  button: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('PricingPlan');

  return (
    <div className="wasl-card px-5 py-6 text-center">
      <div className="text-lg font-semibold">
        {t(`${props.planId}_plan_name`)}
      </div>

      <div className="mt-3 flex items-center justify-center">
        <div className="text-4xl font-semibold">
          {`$${props.price}`}
        </div>

        <div className="ml-1 text-muted-foreground">
          {`/ ${t(`plan_interval_${props.interval}`)}`}
        </div>
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        {t(`${props.planId}_plan_description`)}
      </div>

      {props.button}

      <ul className="mt-6 space-y-3">{props.children}</ul>
    </div>
  );
};

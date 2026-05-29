# Lightweight anti-spam guards

Wasl uses small database-backed guards during beta to reduce accidental repeat submissions without adding CAPTCHA, cookies, Redis, queues, or external security services.

## Public orders

Public order submission keeps the existing idempotency behavior first. If a customer retries with the same idempotency key and the order already exists, Wasl returns that existing order instead of treating the retry as spam.

For new public orders, Wasl checks recent orders for the same restaurant and table scope:

- Limit: 5 new orders
- Window: 60 seconds
- Scope: organization plus table ID when present, or organization plus general ordering when no table is present

Wasl does not store IP addresses for this guard. This keeps the beta privacy-conscious and avoids adding new tracking fields.

If the guard triggers, customers see: "Too many attempts. Please wait a moment and try again."

## Beta feedback

Authenticated dashboard feedback is limited by restaurant and user:

- Limit: 5 feedback submissions
- Window: 10 minutes
- Scope: organization plus submitted user ID

If the guard triggers, users see: "Please wait before sending another feedback."

## Pilot troubleshooting

If a restaurant reports blocked submissions:

1. Check whether staff repeatedly tapped submit during weak connection.
2. Check whether a table received more than five real orders in one minute.
3. Ask the customer to wait one minute and retry from the existing pending order state.
4. Confirm the order did not already appear in the dashboard before asking for another submission.
5. For feedback, ask staff to combine notes or wait ten minutes before sending more.

Future adjustment points are the constants in the public order action and pilot feedback action. Keep thresholds conservative so normal restaurant use remains smooth on weak connections.

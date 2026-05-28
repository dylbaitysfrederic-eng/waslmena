# Wasl Support Runbook

Static support guide for Wasl restaurant pilots. This runbook does not create support tickets, send messages, or modify data.

## First Checks

- Confirm whether the issue affects public menu, restaurant dashboard, or admin.
- Confirm the restaurant organization ID and access status.
- Ask what device, browser, and network were used.
- Check whether the issue reproduces on a second phone or browser.
- Confirm whether the restaurant is in a live pilot service window.

## Common Restaurant Issues

### QR does not open
- Check printed QR clarity, size, lighting, and camera focus.
- Confirm the table still exists in QR & Tables.
- Confirm the restaurant organization is active and not suspended.
- Try the public menu URL directly from a browser.

### Order not appearing
- Confirm the guest saw the order success message.
- Refresh dashboard Orders.
- Check the dashboard is opened under the correct restaurant organization.
- Check internet connectivity on both guest and staff devices.

### Customer says order is pending
- Ask the customer to keep the menu page open.
- Use dashboard Orders refresh.
- Check whether the order appears after a short delay.
- If it does not appear, ask the customer to retry only once.

### Image upload fails
- Verify the file is JPG, PNG, or WEBP.
- Keep menu item photos small, around 300 KB or less.
- Try a different compressed image.
- Confirm the restaurant can continue without the image.

### Weak connection tips
- Keep staff dashboard open on the strongest available Wi-Fi or mobile data.
- Refresh Orders during service.
- Avoid large image uploads during peak service.
- Keep a manual ordering fallback ready during pilots.

### Dashboard access problem
- Confirm the user belongs to the expected organization.
- Check admin Access state and suspension state.
- Confirm the user is not in a personal workspace.
- Ask the user to sign out/in after access is corrected.

## Before Escalating

- Reproduce the issue locally or in staging when possible.
- Capture route, organization ID, table number, browser, device, and timestamp.
- Check whether `npm run verify` passes on the current branch.
- For deployment concerns, run `npm run check:migrations`.
- Identify whether the issue is product behavior, setup data, auth/access, or weak network conditions.

## Production Smoke Test Checklist

- Homepage EN/FR/AR
- Public general menu
- Public table QR menu
- Submit order
- Dashboard orders
- Kitchen ticket print
- Menu item image upload
- Exports
- Modules page
- POS foundation page
- Admin access
- Admin support/beta/demo pages

## Claims Accuracy

- Online payments are not live unless explicitly configured in the future.
- WhatsApp Business automation is not sending messages yet.
- POS integrations are a foundation and do not run automatic sync yet.
- Loyalty is a roadmap/foundation module.
- Delivery is restaurant-owned delivery, not marketplace delivery.

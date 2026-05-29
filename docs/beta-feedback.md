# Beta feedback

Wasl beta feedback is a lightweight internal loop for restaurant pilots. It stores structured notes from authenticated restaurant dashboard users and lets founder admins triage them from `/admin/feedback`.

## How to collect feedback

Use `/dashboard/pilot-feedback` during or immediately after a pilot shift. Ask staff to submit one short note per issue or suggestion so blockers do not get buried inside long messages.

Recommended prompts:

- What slowed the team down?
- What confused staff or customers?
- Did orders appear clearly in the dashboard?
- Was ticket printing readable and usable?
- Were delivery, pickup, and table flows clear?
- Did mobile or weak connections cause problems?

Do not include customer personal data, payment details, passwords, private messages, or sensitive operational notes.

## Admin triage

Review feedback in `/admin/feedback`.

- `blocker`: Prevents a pilot from continuing safely. Review before the next service.
- `high`: Important operational issue that should be fixed or worked around soon.
- `medium`: Useful improvement or repeated friction.
- `low`: Small copy, polish, or training note.

Statuses:

- `new`: Not reviewed yet.
- `reviewed`: Read and understood.
- `planned`: Accepted for follow-up.
- `resolved`: Fixed or handled.
- `dismissed`: Not actionable or no longer relevant.

## Pilot rhythm

Before service, remind staff where the feedback page is. During service, only capture blockers or repeated friction. After service, spend 10 minutes with the owner or manager to submit the most useful notes while the experience is fresh.

import { eq } from 'drizzle-orm';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { db } from '@/libs/DB';
import { saasSettingsSchema } from '@/models/Schema';

import { updateAdminSettingsAction } from '../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminSettingsPage = async (props: {
  searchParams: { status?: string };
}) => {
  const [settings] = await db
    .select()
    .from(saasSettingsSchema)
    .where(eq(saasSettingsSchema.id, 'social_links'))
    .limit(1);

  return (
    <section className="grid gap-4">
      <div className="rounded-md bg-background p-5">
        <h2 className="text-xl font-semibold">SaaS settings</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Configure official Wasl contact and social links used on the public
          landing page. These settings are founder-admin only and are not editable
          by restaurant users.
        </p>
      </div>

      <form
        action={updateAdminSettingsAction}
        className="max-w-2xl rounded-md bg-background p-5"
      >
        <h3 className="font-semibold">Landing page social links</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Leave a field empty to hide that social link from the footer.
        </p>

        {props.searchParams.status === 'saved' && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-950">
            Social links saved.
          </div>
        )}

        {props.searchParams.status === 'invalid_url' && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-950">
            Use a full public URL for Instagram and Facebook, and enter either a full WhatsApp URL or a phone number.
          </div>
        )}
        {props.searchParams.status === 'invalid_email' && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-950">
            Enter a valid support email address before saving.
          </div>
        )}

        <div className="mt-4 grid gap-4">
          <label className="grid gap-1 text-sm font-medium">
            Support email
            <input
              name="supportEmail"
              type="email"
              defaultValue={settings?.supportEmail ?? ''}
              placeholder="hello@waslmena.com"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Instagram URL
            <input
              name="instagramUrl"
              type="url"
              defaultValue={settings?.instagramUrl ?? ''}
              placeholder="https://instagram.com/wasl"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            WhatsApp number or URL
            <input
              name="whatsappNumberOrUrl"
              type="text"
              defaultValue={settings?.whatsappNumberOrUrl ?? ''}
              placeholder="+96170000000 or https://wa.me/96170000000"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium">
            Facebook URL
            <input
              name="facebookUrl"
              type="url"
              defaultValue={settings?.facebookUrl ?? ''}
              placeholder="https://facebook.com/wasl"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            />
          </label>

          <FormSubmitButton pendingLabel="Saving..." size="sm">
            Save social links
          </FormSubmitButton>
        </div>
      </form>
    </section>
  );
};

export default AdminSettingsPage;

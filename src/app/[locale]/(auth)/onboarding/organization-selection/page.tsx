import { OrganizationList } from '@clerk/nextjs';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const OrganizationSelectionPage = async () => {
  const t = await getTranslations('OrganizationSelection');

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-lg space-y-5 text-center">
        <div>
          <h1 className="text-2xl font-semibold">{t('title')}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <OrganizationList
          afterSelectOrganizationUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
          hidePersonal
          skipInvitationScreen
        />
      </section>
    </main>
  );
};

export const dynamic = 'force-dynamic';

export default OrganizationSelectionPage;

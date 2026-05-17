import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { isAdminEmail } from '@/utils/AdminEmails';
import { getI18nPath } from '@/utils/Helpers';

const PostLoginPage = async (props: { params: { locale: string } }) => {
  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress;
  const email = primaryEmail?.emailAddress;
  const verificationStatus = primaryEmail?.verification?.status;
  const isEmailVerified = verificationStatus === undefined
    || verificationStatus === 'verified';

  if (isEmailVerified && isAdminEmail(email)) {
    redirect('/admin');
  }

  redirect(getI18nPath('/dashboard', props.params.locale));
};

export const dynamic = 'force-dynamic';

export default PostLoginPage;

export const getAdminEmails = () => {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
};

export const isAdminEmail = (email: string | null | undefined) => {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.toLowerCase());
};

// Dutch GDPR digital-consent age (16) is Swyp's minimum sign-up age — no App
// Store 4+/9+ style content rating requires a different threshold today.
export const MIN_AGE = 16;

export function isOldEnough(birthdate: string, minAge = MIN_AGE): boolean {
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age >= minAge;
}

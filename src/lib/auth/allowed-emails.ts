export function parseAllowedEmails(allowedEmails: string) {
  return allowedEmails
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(
  allowedEmails: string,
  userEmail: string | null | undefined,
) {
  const normalizedUserEmail = userEmail?.trim().toLowerCase() ?? ''

  if (!normalizedUserEmail) {
    return false
  }

  return parseAllowedEmails(allowedEmails).includes(normalizedUserEmail)
}

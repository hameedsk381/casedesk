/**
 * Who may create a staff account.
 *
 *  - SIGNUP_ENABLED must be exactly "true", otherwise public signup is closed.
 *  - ALLOWED_SIGNUP_EMAILS (comma-separated) optionally restricts signup to
 *    specific addresses or whole domains ("@openvaartha.com"). When it is empty
 *    and signup is enabled, signup is open to anyone — enable that deliberately.
 */
export function isSignupEnabled(): boolean {
  return process.env.SIGNUP_ENABLED === 'true';
}

export function isEmailAllowedToSignUp(email: string): boolean {
  const normalised = email.trim().toLowerCase();
  const allowed = (process.env.ALLOWED_SIGNUP_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.some((entry) => (entry.startsWith('@') ? normalised.endsWith(entry) : normalised === entry));
}

const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_BYTES = 72; // bcrypt silently ignores anything beyond 72 bytes

/** Returns an error message, or null if the password is acceptable. */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') return 'Password is required.';
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) return 'Password is too long (maximum 72 bytes).';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Password must include at least one letter and one number.';
  return null;
}

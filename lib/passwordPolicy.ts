// Single source of truth for password rules. Used by the register + reset-password forms
// (live checklist / client-side check) and by their API routes (server-side enforcement).
// scripts/create-admin.js is a plain Node script, so it carries its own copy of these rules —
// keep them in sync if you change anything here.

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_REQUIREMENTS_HINT =
  "At least 8 characters, with letters, a number and a symbol (e.g. ! @ # $ %).";

export type PasswordChecks = {
  length: boolean;
  letter: boolean;
  number: boolean;
  symbol: boolean;
};

export function checkPassword(password: string): PasswordChecks {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH,
    letter: /[A-Za-z]/.test(password),
    number: /[0-9]/.test(password),
    // Any character that isn't a letter, digit or whitespace counts as a symbol.
    symbol: /[^A-Za-z0-9\s]/.test(password),
  };
}

/** Returns an error message if the password breaks the rules, or null if it's fine. */
export function validatePassword(password: string): string | null {
  const c = checkPassword(password);
  if (c.length && c.letter && c.number && c.symbol) return null;
  return `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include letters, a number and a symbol (e.g. ! @ # $ %).`;
}

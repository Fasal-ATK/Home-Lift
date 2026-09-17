// frontend/src/utils/authValidation.js

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\d{10}$/;
export const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
export const NAME_REGEX = /^[A-Za-z][A-Za-z\s'-]{1,29}$/;

/**
 * Validate email address format and presence
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Enter a valid email address';
  }
  return null;
}

/**
 * Standard password validation shared across Login, Signup, Reset & Change password:
 * - Minimum 8 characters
 * - Maximum 128 characters
 * - Must include at least one letter
 * - Must include at least one number
 * - Cannot contain whitespace
 */
export function validatePassword(password) {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`;
  }
  if (/\s/.test(password)) {
    return 'Password cannot contain spaces';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must include at least one letter';
  }
  if (!/\d/.test(password)) {
    return 'Password must include at least one number';
  }
  return null;
}

/**
 * Validates login credentials (Email + Password)
 * Returns the first error string encountered, or null if valid.
 */
export function validateLoginForm({ email, password }) {
  const emailError = validateEmail(email);
  if (emailError) return emailError;

  const passwordError = validatePassword(password);
  if (passwordError) return passwordError;

  return null;
}

/**
 * Validates signup form data
 * Returns combined error string if any errors exist, or null if valid.
 */
export function validateSignupForm({
  fname,
  lname,
  uname,
  email,
  phone,
  pass1,
  pass2,
}) {
  const errors = [];

  // --- First Name ---
  if (!fname?.trim()) {
    errors.push('First name is required');
  } else if (!NAME_REGEX.test(fname.trim())) {
    errors.push('First name can only contain letters, spaces, hyphens, or apostrophes (2–30 chars)');
  }

  // --- Last Name ---
  if (!lname?.trim()) {
    errors.push('Last name is required');
  } else if (!NAME_REGEX.test(lname.trim())) {
    errors.push('Last name can only contain letters, spaces, hyphens, or apostrophes (2–30 chars)');
  }

  // --- Username ---
  if (!uname?.trim()) {
    errors.push('Username is required');
  } else if (!USERNAME_REGEX.test(uname.trim())) {
    errors.push('Username must be 3–30 characters: letters, numbers, underscores only');
  }

  // --- Email ---
  const emailErr = validateEmail(email);
  if (emailErr) errors.push(emailErr);

  // --- Phone ---
  if (!phone?.trim()) {
    errors.push('Phone number is required');
  } else {
    const rawDigits = phone.trim().replace(/^\+91/, '');
    if (!PHONE_REGEX.test(rawDigits)) {
      errors.push('Phone number must be exactly 10 digits');
    }
  }

  // --- Password ---
  const passErr = validatePassword(pass1);
  if (passErr) {
    errors.push(passErr);
  }

  // --- Confirm Password ---
  if (!pass2) {
    errors.push('Confirm your password');
  } else if (pass1 && pass1 !== pass2) {
    errors.push('Passwords do not match');
  }

  return errors.length > 0 ? errors.join(', ') : null;
}

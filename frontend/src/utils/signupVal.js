export function validateSignupForm({
  fname,
  lname,
  uname,
  email,
  phone,
  pass1,
  pass2,
  // agreed,
}) {
  const errors = [];

  const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)?$/; // letters with optional single space
  const unameRegex = /^[a-zA-Z0-9_]{3,20}$/; // only letters, numbers, underscores
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  // --- First Name ---
  if (!fname?.trim()) errors.push('First name is required');
  else if (!nameRegex.test(fname.trim()))
    errors.push('First name must contain only letters and at most one space in between');

  // --- Last Name ---
  if (!lname?.trim()) errors.push('Last name is required');
  else if (!nameRegex.test(lname.trim()))
    errors.push('Last name must contain only letters and at most one space in between');

  // --- Username ---
  if (!uname?.trim()) errors.push('Username is required');
  else if (!unameRegex.test(uname.trim()))
    errors.push(
      'Username must be 3–20 characters (letters, numbers, underscores only, no spaces)'
    );

  // --- Email ---
  if (!email?.trim()) errors.push('Email is required');
  else if (!emailRegex.test(email.trim())) errors.push('Invalid email format');

  // --- Phone ---
  if (!phone?.trim()) errors.push('Phone number is required');
  else if (!phoneRegex.test(phone.trim()))
    errors.push('Phone number must be 10 digits only');

  // --- Password ---
  if (!pass1) errors.push('Password is required');
  else {
    if (pass1.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[a-zA-Z]/.test(pass1)) errors.push('Password must include at least one letter');
    if (!/\d/.test(pass1)) errors.push('Password must include at least one number');
    if (/\s/.test(pass1)) errors.push('Password cannot contain spaces');
  }

  // --- Confirm Password ---
  if (!pass2) errors.push('Confirm your password');
  else if (pass1 && pass1 !== pass2) errors.push('Passwords do not match');

  // --- Terms Agreement ---
  // if (!agreed) errors.push('You must agree to the terms');

  // Return all messages as a comma-separated string
  return errors.length > 0 ? errors.join(', ') : null;
}

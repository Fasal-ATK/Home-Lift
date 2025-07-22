export function validateSignupForm({ fname, lname, uname, email, phone, pass1, pass2, agreed }) {
  const nameRegex = /^[a-zA-Z]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  if (!fname.trim()) return 'First name is required';
  if (!nameRegex.test(fname.trim())) return 'First name must contain only letters';

  if (!lname.trim()) return 'Last name is required';
  if (!nameRegex.test(lname.trim())) return 'Last name must contain only letters';

  if (!uname.trim()) return 'Username is required';

  if (!email.trim()) return 'Email is required';
  if (!emailRegex.test(email.trim())) return 'Invalid email format';

  if (!phone.trim()) return 'Phone number is required';
  if (!phoneRegex.test(phone.trim())) return 'Phone number must be 10 digits only';

  if (!pass1) return 'Password is required';
  if (pass1.length < 6) return 'Password must be at least 6 characters';

  if (!pass2) return 'Confirm your password';
  if (pass1 !== pass2) return 'Passwords do not match';

  if (!agreed) return 'You must agree to the terms';

  return null;
}

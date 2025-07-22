export default function validateLoginForm({ email, password }) {
    if (!email || !password) {
      return 'Email and password are required';
    }
  
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return 'Enter a valid email address';
    }
  
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
  
    return null; // No errors
  }
  
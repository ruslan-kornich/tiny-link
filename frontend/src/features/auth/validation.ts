const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (!emailPattern.test(email)) {
    return 'Enter a valid email address';
  }
  return undefined;
}

export function validatePassword(password: string, options: { minLength?: number } = {}): string | undefined {
  const minLength = options.minLength ?? 1;
  if (password.length < minLength) {
    return minLength > 1
      ? `Password must be at least ${minLength} characters`
      : 'Password is required';
  }
  return undefined;
}

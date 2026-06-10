import { useState, type FormEvent } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router';
import { ApiError } from '../api/apiClient';
import { useAuth } from '../features/auth/useAuth';
import { useLoginMutation } from '../features/auth/useLoginMutation';
import { validateEmail, validatePassword } from '../features/auth/validation';
import { AuthFormLayout } from '../features/auth/AuthFormLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export function LoginPage() {
  const { isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const errors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setFieldErrors(errors);
    setSubmitError(null);
    if (errors.email || errors.password) {
      return;
    }
    loginMutation.mutate(
      { email, password },
      {
        onSuccess: (tokenResponse) => {
          signIn(tokenResponse.accessToken, tokenResponse.expiresIn);
          navigate('/');
        },
        onError: (error) => {
          if (error instanceof ApiError && error.statusCode === 401) {
            setSubmitError('Invalid email or password');
          } else {
            setSubmitError(error.message);
          }
        },
      },
    );
  }

  return (
    <AuthFormLayout heading="Sign in to your account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {submitError && <Alert tone="error">{submitError}</Alert>}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          error={fieldErrors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={fieldErrors.password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" isLoading={loginMutation.isPending}>
          Sign in
        </Button>
        <p className="text-center text-sm text-slate-600">
          No account?{' '}
          <RouterLink to="/register" className="font-medium text-indigo-600 hover:underline">
            Register
          </RouterLink>
        </p>
      </form>
    </AuthFormLayout>
  );
}

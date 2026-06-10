import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/apiClient';

interface LoginInput {
  email: string;
  password: string;
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }: LoginInput) => login(email, password),
  });
}

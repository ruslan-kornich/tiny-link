import { useMutation } from '@tanstack/react-query';
import { login, register } from '../../api/apiClient';

interface RegisterInput {
  email: string;
  password: string;
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async ({ email, password }: RegisterInput) => {
      await register(email, password);
      return login(email, password);
    },
  });
}

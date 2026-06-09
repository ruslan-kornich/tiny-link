import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../src/modules/auth/auth.service';
import { AuthRepository, UserRow } from '../../src/modules/auth/auth.repository';
import { ConfigService } from '../../src/config/config.service';

function buildService(seedUser: UserRow | null) {
  const store: UserRow[] = seedUser ? [seedUser] : [];
  const repo: Pick<AuthRepository, 'findByEmail' | 'create'> = {
    findByEmail: async (email) => store.find((user) => user.email === email) ?? null,
    create: async (email, passwordHash) => {
      const created = { id: 1n, email, passwordHash };
      store.push(created);
      return { id: created.id, email: created.email };
    },
  };
  const jwt = new JwtService({ secret: 'x'.repeat(32) });
  const config = { get: (key: string) => (key === 'JWT_EXPIRES_IN' ? 3600 : '') } as unknown as ConfigService;
  return new AuthService(repo as AuthRepository, jwt, config);
}

describe('AuthService', () => {
  it('registers a new user and returns id + email (no hash leaked)', async () => {
    const service = buildService(null);
    const result = await service.register({ email: 'a@b.com', password: 'password1' });
    expect(result).toEqual({ id: 1n, email: 'a@b.com' });
  });

  it('rejects duplicate email with ConflictException', async () => {
    const service = buildService({ id: 1n, email: 'a@b.com', passwordHash: 'irrelevant' });
    await expect(service.register({ email: 'a@b.com', password: 'password1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('logs in with correct credentials and returns a token', async () => {
    const service = buildService(null);
    await service.register({ email: 'a@b.com', password: 'password1' });
    const result = await service.login({ email: 'a@b.com', password: 'password1' });
    expect(typeof result.accessToken).toBe('string');
    expect(result.expiresIn).toBe(3600);
  });

  it('rejects wrong password with UnauthorizedException', async () => {
    const service = buildService(null);
    await service.register({ email: 'a@b.com', password: 'password1' });
    await expect(service.login({ email: 'a@b.com', password: 'wrong-pass' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects unknown email with UnauthorizedException', async () => {
    const service = buildService(null);
    await expect(
      service.login({ email: 'nobody@example.com', password: 'password1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

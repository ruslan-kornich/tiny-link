import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { execSync } from 'node:child_process';

export type StartedInfra = {
  postgres: StartedTestContainer;
  redis: StartedTestContainer;
  databaseUrl: string;
  redisUrl: string;
  stop: () => Promise<void>;
};

export async function startInfra(): Promise<StartedInfra> {
  const postgres = await new GenericContainer('postgres:16')
    .withEnvironment({
      POSTGRES_USER: 'tinylink',
      POSTGRES_PASSWORD: 'tinylink',
      POSTGRES_DB: 'tinylink',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage(/database system is ready to accept connections/, 2))
    .start();

  const redis = await new GenericContainer('redis:7')
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage(/Ready to accept connections/))
    .start();

  const databaseUrl = `postgresql://tinylink:tinylink@${postgres.getHost()}:${postgres.getMappedPort(
    5432,
  )}/tinylink?schema=public`;
  const redisUrl = `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`;

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  return {
    postgres,
    redis,
    databaseUrl,
    redisUrl,
    stop: async () => {
      await postgres.stop();
      await redis.stop();
    },
  };
}

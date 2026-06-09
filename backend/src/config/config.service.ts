import { Injectable } from '@nestjs/common';
import { AppConfig, envSchema } from './env.schema';

@Injectable()
export class ConfigService {
  private readonly values: AppConfig;

  constructor() {
    this.values = envSchema.parse(process.env);
  }

  get<Key extends keyof AppConfig>(key: Key): AppConfig[Key] {
    return this.values[key];
  }
}

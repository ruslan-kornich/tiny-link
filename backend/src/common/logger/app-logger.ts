// src/common/logger/app-logger.ts
import { ConsoleLogger, LogLevel } from '@nestjs/common';

export class AppLogger extends ConsoleLogger {
  constructor(context: string) {
    super(context, { logLevels: defaultLogLevels() });
  }
}

function defaultLogLevels(): LogLevel[] {
  return process.env.NODE_ENV === 'production'
    ? ['log', 'warn', 'error']
    : ['debug', 'log', 'warn', 'error', 'verbose'];
}

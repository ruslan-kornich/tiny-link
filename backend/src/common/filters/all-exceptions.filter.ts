// src/common/filters/all-exceptions.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

type ErrorBody = { statusCode: number; message: string; error: string };

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(this.toBody(status, exception));
      return;
    }

    this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : undefined);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  }

  private toBody(status: number, exception: HttpException): ErrorBody {
    const payload = exception.getResponse();
    // HttpException accepts any payload; narrow to string or object-with-message
    // before reading .message so a non-object payload can't crash the filter.
    const message =
      typeof payload === 'string'
        ? payload
        : typeof payload === 'object' && payload !== null && 'message' in payload
          ? ((payload as { message?: string | string[] }).message ?? exception.message)
          : exception.message;
    return {
      statusCode: status,
      message: Array.isArray(message) ? message.join('; ') : message,
      error: HttpStatus[status] ? this.humanize(HttpStatus[status]) : 'Error',
    };
  }

  private humanize(statusName: string | number): string {
    return String(statusName)
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}

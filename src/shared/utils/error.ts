import { ErrorType } from './error-types';

export class CustomError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public errorType: ErrorType = ErrorType.INTERNAL
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

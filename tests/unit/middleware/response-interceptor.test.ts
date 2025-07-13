import { Request, Response, NextFunction } from 'express';
import { responseInterceptor } from '../../../src/shared/middleware/response-interceptor';

describe('Response Interceptor Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockJson: jest.Mock;

  beforeEach(() => {
    req = {};
    mockJson = jest.fn();
    res = {
      json: mockJson,
    };
    next = jest.fn();
  });

  it('should wrap successful response data with standard format', () => {
    responseInterceptor(req as Request, res as Response, next);

    const testData = { message: 'Success', userId: '123' };
    (res.json as jest.Mock)(testData);

    expect(mockJson).toHaveBeenCalledWith({
      result: {
        message: 'Success',
        userId: '123',
        date: expect.any(String),
      },
      error: null,
    });
  });

  it('should not modify already formatted error responses', () => {
    responseInterceptor(req as Request, res as Response, next);

    const errorData = {
      result: null,
      error: {
        code: 400,
        message: 'Validation failed',
        errorType: 'VALIDATION_ERROR',
      },
    };

    (res.json as jest.Mock)(errorData);

    expect(mockJson).toHaveBeenCalledWith(errorData);
  });

  it('should handle empty response data', () => {
    responseInterceptor(req as Request, res as Response, next);

    (res.json as jest.Mock)({});

    expect(mockJson).toHaveBeenCalledWith({
      result: {
        date: expect.any(String),
      },
      error: null,
    });
  });

  it('should handle null response data', () => {
    responseInterceptor(req as Request, res as Response, next);

    (res.json as jest.Mock)(null);

    expect(mockJson).toHaveBeenCalledWith({
      result: {
        date: expect.any(String),
      },
      error: null,
    });
  });

  it('should add ISO date string to response', () => {
    responseInterceptor(req as Request, res as Response, next);

    const testData = { message: 'Test' };
    (res.json as jest.Mock)(testData);

    const calledWith = mockJson.mock.calls[0][0];
    expect(calledWith.result.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });

  it('should call next() to continue middleware chain', () => {
    responseInterceptor(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should preserve original json method binding', () => {
    responseInterceptor(req as Request, res as Response, next);

    const testData = { test: 'data' };
    (res.json as jest.Mock)(testData);

    expect(mockJson).toHaveBeenCalledTimes(1);
  });
});

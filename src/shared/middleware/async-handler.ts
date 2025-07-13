import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve()
      .then(() => fn(req, res, next))
      .catch(next);
  };
};

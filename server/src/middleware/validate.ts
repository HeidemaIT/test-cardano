import type { ZodSchema } from 'zod';
import type { Request, Response, NextFunction } from 'express';

type ZodLike<T> = ZodSchema<T>;

function makeValidator<T>(
  schema: ZodLike<T>,
  pick: (req: Request) => unknown,
  errorMessage: string,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const parsed = schema.safeParse(pick(req));
    if (!parsed.success) {
      res.status(400).json({ error: errorMessage, details: parsed.error.flatten() });
      return;
    }
    next();
  };
}

export function validateBody<T>(schema: ZodLike<T>) {
  return makeValidator(schema, (req) => req.body, 'Invalid request body');
}

export function validateQuery<T>(schema: ZodLike<T>) {
  return makeValidator(schema, (req) => req.query, 'Invalid request query');
}

export function validateParams<T>(schema: ZodLike<T>) {
  return makeValidator(schema, (req) => req.params, 'Invalid request params');
}

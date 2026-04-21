import { NextFunction, Response } from 'express';
import Joi from 'joi';
import { AuthRequest } from '../types/auth.types';
import { fail } from '../utils/response';

export function validateBody<T>(schema: Joi.ObjectSchema<T>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return fail(res, 400, 'Validation error', error.details.map((d) => d.message));
    }
    req.body = value;
    next();
  };
}

export function validateQuery<T>(schema: Joi.ObjectSchema<T>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) {
      return fail(res, 400, 'Validation error', error.details.map((d) => d.message));
    }
    req.query = value as typeof req.query;
    next();
  };
}

import type { NextFunction, Request, Response } from 'express';
import {
  EmailAlreadyRegisteredError,
  InvalidUserDataError,
  InvalidVerificationCodeError,
  UserAlreadyVerifiedError,
  UserNotFoundError,
} from '../../domain/errors.js';

/**
 * HEXAGONAL: único lugar que traduz erro de domínio -> status HTTP.
 * Erros desconhecidos viram 500 com mensagem genérica, para que detalhes
 * internos (ex.: falha de SMTP) não vazem para o cliente.
 */
const STATUS_BY_ERROR = new Map<Function, number>([
  [InvalidUserDataError, 400],
  [InvalidVerificationCodeError, 400],
  [UserNotFoundError, 404],
  [EmailAlreadyRegisteredError, 409],
  [UserAlreadyVerifiedError, 409],
]);

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  const status = STATUS_BY_ERROR.get(err.constructor);
  if (status) {
    res.status(status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Erro interno' });
}

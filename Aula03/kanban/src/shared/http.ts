import type { Response } from 'express';

export type ControllerResult =
  | { status: number; view: string; locals: Record<string, unknown> }
  | { redirectTo: string };

export function respond(res: Response, result: ControllerResult): void {
  if ('redirectTo' in result) {
    res.redirect(result.redirectTo);
    return;
  }
  res.status(result.status).render(result.view, result.locals);
}

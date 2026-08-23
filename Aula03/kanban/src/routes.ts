import { Router, type Request, type Response } from 'express';
import type { BoardController } from './boards/BoardController.js';
import type { CardController } from './cards/CardController.js';
import { respond } from './shared/http.js';

/**
 * Rotas do quadro padrão (`/`) e rotas com `:boardId` (Atividade 11).
 * As rotas sem prefixo continuam apontando para o quadro default.
 */
export function createRoutes(boardController: BoardController, cardController: CardController): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response) => {
    respond(res, boardController.showBoard());
  });

  router.get('/boards/:boardId', (req: Request, res: Response) => {
    respond(res, boardController.showBoard(req.params.boardId));
  });

  router.post('/columns', (req: Request, res: Response) => {
    respond(res, boardController.createColumn(req.body));
  });

  router.post('/boards/:boardId/columns', (req: Request, res: Response) => {
    respond(res, boardController.createColumn(req.body, req.params.boardId));
  });

  router.get('/cards/search', (req: Request, res: Response) => {
    respond(res, cardController.search(req.query));
  });

  router.get('/boards/:boardId/cards/search', (req: Request, res: Response) => {
    respond(res, cardController.search(req.query, req.params.boardId));
  });

  router.get('/cards/:id', (req: Request, res: Response) => {
    respond(res, cardController.showDetail(req.params.id));
  });

  router.get('/boards/:boardId/cards/:id', (req: Request, res: Response) => {
    respond(res, cardController.showDetail(req.params.id, req.params.boardId));
  });

  router.post('/cards', (req: Request, res: Response) => {
    respond(res, cardController.create(req.body));
  });

  router.post('/boards/:boardId/cards', (req: Request, res: Response) => {
    respond(res, cardController.create(req.body, req.params.boardId));
  });

  router.post('/cards/:id/move', (req: Request, res: Response) => {
    respond(res, cardController.move(req.params.id, req.body));
  });

  router.post('/boards/:boardId/cards/:id/move', (req: Request, res: Response) => {
    respond(res, cardController.move(req.params.id, req.body, req.params.boardId));
  });

  router.post('/cards/:id/update', (req: Request, res: Response) => {
    respond(res, cardController.update(req.params.id, req.body));
  });

  router.post('/boards/:boardId/cards/:id/update', (req: Request, res: Response) => {
    respond(res, cardController.update(req.params.id, req.body, req.params.boardId));
  });

  router.post('/cards/:id/delete', (req: Request, res: Response) => {
    respond(res, cardController.remove(req.params.id));
  });

  router.post('/boards/:boardId/cards/:id/delete', (req: Request, res: Response) => {
    respond(res, cardController.remove(req.params.id, req.params.boardId));
  });

  return router;
}

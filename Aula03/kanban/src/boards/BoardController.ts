import type { BoardRepository } from './BoardRepository.js';
import type { CardRepository } from '../cards/CardRepository.js';
import type { ControllerResult } from '../shared/http.js';
import { toBoardViewModel } from './boardView.js';
import { BoardNotFoundError } from './errors.js';

/**
 * CONTROLLER — orquestra o quadro: busca Board (boards/) e Cards (cards/),
 * pede para a View montar o "view model" e devolve o resultado pronto para
 * `routes.ts` renderizar.
 */
export class BoardController {
  constructor(
    private readonly boardRepository: BoardRepository,
    private readonly cardRepository: CardRepository,
  ) {}

  showBoard(boardId?: string): ControllerResult {
    const board = this.requireBoard(boardId);
    const cards = this.cardRepository.findByBoard(board.id);
    return {
      status: 200,
      view: 'board/index',
      locals: { board: toBoardViewModel(board, cards) },
    };
  }

  /**
   * Atividade 7: cria uma coluna (`{ name, wipLimit? }`) e redireciona
   * para o quadro. Nome inválido → 400; nome duplicado → 409.
   */
  createColumn(body: unknown, boardId?: string): ControllerResult {
    const { name, wipLimit } = body as { name?: string; wipLimit?: number | null };
    const board = this.requireBoard(boardId);
    board.addColumn(name as string, wipLimit ?? null);
    this.boardRepository.save(board);
    return { redirectTo: this.boardPath(board.id) };
  }

  private requireBoard(boardId?: string) {
    if (!boardId) {
      return this.boardRepository.getDefault();
    }
    const board = this.boardRepository.findById(boardId);
    if (!board) {
      throw new BoardNotFoundError(boardId);
    }
    return board;
  }

  private boardPath(boardId: string): string {
    return boardId === this.boardRepository.getDefault().id ? '/' : `/boards/${boardId}`;
  }
}

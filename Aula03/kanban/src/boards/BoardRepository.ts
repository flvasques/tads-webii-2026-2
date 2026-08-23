import type { Board } from './Board.js';

/**
 * MODEL (persistência) — banco em memória dos quadros. `getDefault()`
 * continua existindo para `GET /`; `findById`/`save` suportam múltiplos
 * quadros (Atividade 11).
 */
export interface BoardRepository {
  getDefault(): Board;
  findById(id: string): Board | undefined;
  save(board: Board): void;
  findAll(): Board[];
}

export class InMemoryBoardRepository implements BoardRepository {
  private readonly boards = new Map<string, Board>();
  private readonly defaultId: string;

  constructor(board: Board | Board[]) {
    const list = Array.isArray(board) ? board : [board];
    this.defaultId = list[0].id;
    for (const item of list) {
      this.boards.set(item.id, item);
    }
  }

  getDefault(): Board {
    return this.boards.get(this.defaultId)!;
  }

  findById(id: string): Board | undefined {
    return this.boards.get(id);
  }

  save(board: Board): void {
    this.boards.set(board.id, board);
  }

  findAll(): Board[] {
    return Array.from(this.boards.values());
  }
}

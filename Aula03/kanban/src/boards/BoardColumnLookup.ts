import type { ColumnLookup, ColumnInfo } from '../cards/ColumnLookup.js';
import type { BoardRepository } from './BoardRepository.js';
import { BoardNotFoundError } from './errors.js';

/**
 * Adapter: implementa o port `ColumnLookup` de `cards/` usando o
 * `BoardRepository`. É aqui que a dependência de módulo mora — não no
 * CardController.
 */
export class BoardColumnLookup implements ColumnLookup {
  constructor(private readonly boardRepository: BoardRepository) {}

  defaultBoardId(): string {
    return this.boardRepository.getDefault().id;
  }

  hasColumn(columnId: string, boardId?: string): boolean {
    return this.resolveBoard(boardId).hasColumn(columnId);
  }

  getColumn(columnId: string, boardId?: string): ColumnInfo {
    const column = this.resolveBoard(boardId).findColumn(columnId);
    return { name: column.name, wipLimit: column.wipLimit };
  }

  private resolveBoard(boardId?: string) {
    if (!boardId) {
      return this.boardRepository.getDefault();
    }
    const board = this.boardRepository.findById(boardId);
    if (!board) {
      throw new BoardNotFoundError(boardId);
    }
    return board;
  }
}

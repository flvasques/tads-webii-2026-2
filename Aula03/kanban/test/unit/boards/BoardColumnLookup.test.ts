import { describe, expect, it } from 'vitest';
import { Board } from '../../../src/boards/Board.js';
import { BoardColumnLookup } from '../../../src/boards/BoardColumnLookup.js';
import { InMemoryBoardRepository } from '../../../src/boards/BoardRepository.js';
import { Column } from '../../../src/boards/Column.js';
import { BoardNotFoundError, ColumnNotFoundError } from '../../../src/boards/errors.js';

function buildLookup(): BoardColumnLookup {
  const board = Board.create('board-1', 'Quadro', [Column.create('col-1', 'A Fazer', 1, 3)]);
  return new BoardColumnLookup(new InMemoryBoardRepository(board));
}

describe('BoardColumnLookup', () => {
  it('resolve o quadro default e devolve dados da coluna', () => {
    const lookup = buildLookup();

    expect(lookup.defaultBoardId()).toBe('board-1');
    expect(lookup.hasColumn('col-1')).toBe(true);
    expect(lookup.getColumn('col-1')).toEqual({ name: 'A Fazer', wipLimit: 3 });
  });

  it('lança BoardNotFoundError quando o boardId não existe', () => {
    const lookup = buildLookup();

    expect(() => lookup.hasColumn('col-1', 'ghost')).toThrow(BoardNotFoundError);
    expect(() => lookup.getColumn('col-1', 'ghost')).toThrow(BoardNotFoundError);
  });

  it('propaga ColumnNotFoundError do quadro resolvido', () => {
    const lookup = buildLookup();

    expect(() => lookup.getColumn('col-x', 'board-1')).toThrow(ColumnNotFoundError);
  });
});

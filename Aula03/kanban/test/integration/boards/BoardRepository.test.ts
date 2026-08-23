import { describe, expect, it } from 'vitest';
import { Board } from '../../../src/boards/Board.js';
import { Column } from '../../../src/boards/Column.js';
import { InMemoryBoardRepository } from '../../../src/boards/BoardRepository.js';

describe('InMemoryBoardRepository', () => {
  it('devolve sempre o mesmo quadro passado na construção', () => {
    const board = Board.create('board-1', 'Quadro de Teste', [Column.create('col-1', 'A Fazer', 1)]);
    const repository = new InMemoryBoardRepository(board);

    expect(repository.getDefault()).toBe(board);
    expect(repository.getDefault().name).toBe('Quadro de Teste');
    expect(repository.findById('board-1')).toBe(board);
    expect(repository.findById('inexistente')).toBeUndefined();
  });

  it('guarda vários quadros e persiste alterações via save', () => {
    const first = Board.create('board-1', 'Primeiro', [Column.create('col-1', 'A Fazer', 1)]);
    const second = Board.create('board-2', 'Segundo', [Column.create('col-a', 'Ideias', 1)]);
    const repository = new InMemoryBoardRepository([first, second]);

    expect(repository.getDefault().id).toBe('board-1');
    expect(repository.findAll()).toHaveLength(2);

    second.addColumn('Backlog');
    repository.save(second);

    expect(repository.findById('board-2')?.columns).toHaveLength(2);
  });
});

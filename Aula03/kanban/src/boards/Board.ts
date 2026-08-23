import { randomUUID } from 'node:crypto';
import { Column, type ColumnSnapshot } from './Column.js';
import { ColumnNotFoundError, DuplicateColumnNameError } from './errors.js';

export interface BoardSnapshot {
  id: string;
  name: string;
  columns: ColumnSnapshot[];
}

/**
 * MODEL — o quadro (aggregate root): agrupa as colunas. Nesta versão do
 * template só existe UM quadro fixo (ver `src/seed.ts`); suportar vários
 * quadros é uma atividade de estica (Atividade 10).
 */
export class Board {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _columns: Column[],
  ) {}

  static create(id: string, name: string, columns: Column[]): Board {
    return new Board(id, name, columns);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get columns(): readonly Column[] {
    return this._columns;
  }

  findColumn(columnId: string): Column {
    const column = this._columns.find((c) => c.id === columnId);
    if (!column) {
      throw new ColumnNotFoundError(columnId);
    }
    return column;
  }

  hasColumn(columnId: string): boolean {
    return this._columns.some((c) => c.id === columnId);
  }

  /**
   * Atividade 7: cria e adiciona uma coluna ao final do quadro.
   * Decisão do grupo: nomes duplicados no mesmo quadro são proibidos
   * (comparação case-insensitive) — evitaria duas "Em Andamento".
   */
  addColumn(name: string, wipLimit: number | null = null): Column {
    const normalized = typeof name === 'string' ? name.trim().toLowerCase() : '';
    if (normalized && this._columns.some((column) => column.name.toLowerCase() === normalized)) {
      throw new DuplicateColumnNameError(name.trim());
    }

    const nextOrder = this._columns.reduce((max, column) => Math.max(max, column.order), 0) + 1;
    const column = Column.create(randomUUID(), name, nextOrder, wipLimit);
    this._columns.push(column);
    return column;
  }

  toSnapshot(): BoardSnapshot {
    return {
      id: this._id,
      name: this._name,
      columns: this._columns.map((c) => c.toSnapshot()).sort((a, b) => a.order - b.order),
    };
  }
}

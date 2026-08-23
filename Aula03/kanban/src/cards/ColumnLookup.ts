/**
 * PORT (Atividade 10) — o que o módulo `cards` precisa saber sobre
 * colunas, sem importar `BoardRepository` nem tipos internos de `boards/`.
 *
 * Trade-off: isso inverte a dependência (cards define o contrato; boards
 * implementa). Não elimina o acoplamento de negócio — alguém ainda precisa
 * perguntar se a coluna existe e qual é o WIP. Só tira o import direto
 * de `BoardRepository` de dentro do CardController. Se o "port" crescer
 * até espelhar o Board inteiro, a abstração vira disfarce.
 */
export interface ColumnInfo {
  name: string;
  wipLimit: number | null;
}

export interface ColumnLookup {
  defaultBoardId(): string;
  hasColumn(columnId: string, boardId?: string): boolean;
  getColumn(columnId: string, boardId?: string): ColumnInfo;
}

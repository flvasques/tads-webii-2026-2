import { Card, type CardPriority } from './Card.js';
import type { CardRepository } from './CardRepository.js';
import type { ColumnLookup } from './ColumnLookup.js';
import { CardNotFoundError, DuplicateCardTitleError, WipLimitExceededError } from './errors.js';
import { ColumnNotFoundError } from '../boards/errors.js';
import { toCardDetailViewModel, toCardSearchViewModel } from './cardView.js';
import type { ControllerResult } from '../shared/http.js';

/**
 * CONTROLLER — orquestra os casos de uso de cartão. Depende do port
 * `ColumnLookup` (Atividade 10), não de `BoardRepository` diretamente.
 */
export class CardController {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly columnLookup: ColumnLookup,
  ) {}

  create(body: unknown, boardId?: string): ControllerResult {
    const resolvedBoardId = boardId ?? this.columnLookup.defaultBoardId();
    const { title, columnId, priority, description } = body as {
      title?: string;
      columnId?: string;
      priority?: CardPriority;
      description?: string;
    };

    const card = Card.create(title as string, columnId as string, priority, description, resolvedBoardId);

    if (!this.columnLookup.hasColumn(card.columnId, resolvedBoardId)) {
      throw new ColumnNotFoundError(card.columnId);
    }
    this.assertColumnHasWipCapacity(card.columnId, resolvedBoardId);
    this.assertUniqueTitleInColumn(card.title, card.columnId, undefined, resolvedBoardId);

    this.cardRepository.save(card);
    return { redirectTo: this.boardPath(resolvedBoardId) };
  }

  /**
   * Atividade 2 + 5: move um cartão. 404 se o cartão ou a coluna destino
   * não existem; 409 se o WIP da destino já foi atingido.
   */
  move(id: string, body: unknown, boardId?: string): ControllerResult {
    const card = this.requireCard(id, boardId);
    const { columnId } = body as { columnId?: string };
    const resolvedBoardId = card.boardId;

    if (!this.columnLookup.hasColumn(columnId as string, resolvedBoardId)) {
      throw new ColumnNotFoundError(columnId as string);
    }
    if (columnId !== card.columnId) {
      this.assertColumnHasWipCapacity(columnId as string, resolvedBoardId);
    }

    card.changeColumn(columnId as string);
    this.cardRepository.save(card);
    return { redirectTo: this.boardPath(resolvedBoardId) };
  }

  /**
   * Atividade 3: edita título, descrição e/ou prioridade. Campos omitidos
   * permanecem inalterados. 404 se o cartão não existe; 400 se inválido;
   * 409 se o novo título duplicar outro na mesma coluna.
   */
  update(id: string, body: unknown, boardId?: string): ControllerResult {
    const card = this.requireCard(id, boardId);
    const { title, description, priority } = body as {
      title?: string;
      description?: string;
      priority?: CardPriority;
    };

    if (title !== undefined) {
      this.assertUniqueTitleInColumn(title, card.columnId, card.id, card.boardId);
      card.rename(title, description);
    } else if (description !== undefined) {
      card.rename(card.title, description);
    }

    if (priority !== undefined) {
      card.changePriority(priority);
    }

    this.cardRepository.save(card);
    return { redirectTo: this.boardPath(card.boardId) };
  }

  /**
   * Atividade 4: exclui um cartão existente. 404 se não existe.
   * Decisão do grupo: NÃO há restrição para excluir cartão em "Concluído"
   * — diferente da regra da Aula 02, excluir algo já terminado não perde
   * histórico relevante neste quadro.
   */
  remove(id: string, boardId?: string): ControllerResult {
    const card = this.requireCard(id, boardId);
    this.cardRepository.delete(card.id);
    return { redirectTo: this.boardPath(card.boardId) };
  }

  /** Atividade 8: página de detalhe. 404 se o cartão não existe. */
  showDetail(id: string, boardId?: string): ControllerResult {
    const card = this.requireCard(id, boardId);
    const columnName = this.columnLookup.getColumn(card.columnId, card.boardId).name;
    return {
      status: 200,
      view: 'cards/show',
      locals: { card: toCardDetailViewModel(card, columnName) },
    };
  }

  /**
   * Atividade 9: busca por título (case-insensitive). Termo vazio
   * devolve todos os cartões (do quadro, se `boardId` for informado).
   */
  search(query: unknown, boardId?: string): ControllerResult {
    const term = String((query as { query?: unknown })?.query ?? '');
    const normalized = term.trim().toLowerCase();
    const source = boardId ? this.cardRepository.findByBoard(boardId) : this.cardRepository.findAll();
    const cards = source.filter((card) => !normalized || card.title.toLowerCase().includes(normalized));

    return {
      status: 200,
      view: 'cards/search',
      locals: { query: term, cards: cards.map(toCardSearchViewModel) },
    };
  }

  private requireCard(id: string, boardId?: string): Card {
    const card = this.cardRepository.findById(id);
    if (!card || (boardId !== undefined && card.boardId !== boardId)) {
      throw new CardNotFoundError(id);
    }
    return card;
  }

  private boardPath(boardId: string): string {
    return boardId === this.columnLookup.defaultBoardId() ? '/' : `/boards/${boardId}`;
  }

  private assertColumnHasWipCapacity(columnId: string, boardId: string): void {
    const column = this.columnLookup.getColumn(columnId, boardId);
    if (column.wipLimit !== null && this.cardRepository.findByColumn(columnId, boardId).length >= column.wipLimit) {
      throw new WipLimitExceededError(column.name, column.wipLimit);
    }
  }

  private assertUniqueTitleInColumn(title: string, columnId: string, excludeId?: string, boardId?: string): void {
    if (this.cardRepository.existsWithTitleInColumn(title, columnId, excludeId, boardId)) {
      throw new DuplicateCardTitleError(title.trim());
    }
  }
}

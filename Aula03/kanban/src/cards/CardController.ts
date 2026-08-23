import { Card, type CardPriority } from './Card.js';
import type { CardRepository } from './CardRepository.js';
import type { BoardRepository } from '../boards/BoardRepository.js';
import { CardNotFoundError } from './errors.js';
import { ColumnNotFoundError } from '../boards/errors.js';
import type { ControllerResult } from '../shared/http.js';
import { NotImplementedError } from '../shared/errors.js';

/**
 * CONTROLLER — nenhum método está implementado ainda. Isso é proposital:
 * cada método corresponde a uma atividade proposta na Aula 03 (ver
 * aula03.md). O construtor já recebe os dois repositórios que vocês vão
 * precisar — `cardRepository` para persistir cartões, `boardRepository`
 * para validar que uma coluna existe antes de criar/mover um cartão nela.
 */
export class CardController {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly boardRepository: BoardRepository,
  ) {}

 
  create(body: unknown): ControllerResult {
    const { title, columnId, priority, description } = body as {
      title?: string;
      columnId?: string;
      priority?: CardPriority;
      description?: string;
    };

    const card = Card.create(title as string, columnId as string, priority, description);

    if (!this.boardRepository.getDefault().hasColumn(card.columnId)) {
      throw new ColumnNotFoundError(card.columnId);
    }

    this.cardRepository.save(card);
    return { redirectTo: '/' };
  }

  /**
   * Atividade 2: move um cartão para outra coluna (`{ columnId }` no
   * corpo). 404 se o cartão ou a coluna destino não existem. A checagem
   * de coluna vem ANTES de `changeColumn` para não mutar o cartão num
   * fluxo que termina em erro.
   *
   * Decisão do grupo: o limite de WIP da coluna destino fica para a
   * Atividade 5 — aqui só validamos existência.
   */
  move(id: string, body: unknown): ControllerResult {
    const card = this.cardRepository.findById(id);
    if (!card) {
      throw new CardNotFoundError(id);
    }

    const { columnId } = body as { columnId?: string };
    if (!this.boardRepository.getDefault().hasColumn(columnId as string)) {
      throw new ColumnNotFoundError(columnId as string);
    }

    card.changeColumn(columnId as string);
    this.cardRepository.save(card);
    return { redirectTo: '/' };
  }

  /**
   * TODO (Atividade 3): editar título/descrição/prioridade de um cartão
   * existente (`{ title?, description?, priority? }`).
   */
  update(_id: string, _body: unknown): ControllerResult {
    throw new NotImplementedError('CardController#update');
  }

  /** TODO (Atividade 4): excluir um cartão existente. */
  remove(_id: string): ControllerResult {
    throw new NotImplementedError('CardController#remove');
  }

  /** TODO (Atividade 8, estica): página de detalhe de um cartão. */
  showDetail(_id: string): ControllerResult {
    throw new NotImplementedError('CardController#showDetail');
  }

  /** TODO (Atividade 9, estica): buscar cartões por título (`?query=`). */
  search(_query: unknown): ControllerResult {
    throw new NotImplementedError('CardController#search');
  }
}

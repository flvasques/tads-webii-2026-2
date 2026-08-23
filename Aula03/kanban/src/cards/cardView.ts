import type { Card } from './Card.js';

/**
 * VIEW — view models do módulo cards (detalhe e busca). O Controller
 * só orquestra; o template só itera estes objetos.
 */

export interface CardDetailViewModel {
  id: string;
  title: string;
  description: string;
  priority: string;
  columnName: string;
}

export interface CardSearchViewModel {
  id: string;
  title: string;
  description: string;
  priority: string;
}

export function toCardDetailViewModel(card: Card, columnName: string): CardDetailViewModel {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    priority: card.priority,
    columnName,
  };
}

export function toCardSearchViewModel(card: Card): CardSearchViewModel {
  return {
    id: card.id,
    title: card.title,
    description: card.description,
    priority: card.priority,
  };
}

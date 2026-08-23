import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../src/server.js';
import { Card } from '../../../src/cards/Card.js';
import {
  buildMultiBoardRepositories,
  buildTestRepositories,
  buildWipTestRepositories,
} from '../../helpers/fixtures.js';

/**
 * Estas rotas ainda não fazem nada além de responder 501 — é o
 * comportamento CORRETO do estado inicial do template. Conforme vocês
 * implementam cada atividade, substituam o teste "responde 501" pelos
 * `test.todo` correspondentes (já escritos abaixo como checklist).
 */
describe('POST /cards (Atividade 1)', () => {
  it('cria um cartão válido e redireciona para /', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app)
      .post('/cards')
      .send({ title: 'Novo cartão', columnId: 'col-1', priority: 'alta', description: 'detalhes' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');

    const board = await request(app).get('/');
    expect(board.text).toContain('Novo cartão');
    expect(board.text).toContain('detalhes');
  });

  it('rejeita título com menos de 3 caracteres com 400', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards').send({ title: 'ab', columnId: 'col-1' });

    expect(response.status).toBe(400);
  });

  it('rejeita columnId de uma coluna que não existe com 404', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app)
      .post('/cards')
      .send({ title: 'Cartão órfão', columnId: 'col-inexistente' });

    expect(response.status).toBe(404);
  });
});

describe('POST /cards/:id/move (Atividade 2)', () => {
  it('move o cartão para a coluna informada e redireciona para /', async () => {
    const repositories = buildTestRepositories();
    const card = Card.create('Cartão para mover', 'col-1');
    repositories.cardRepository.save(card);
    const app = createServer(repositories);

    const response = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-2' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(repositories.cardRepository.findById(card.id)?.columnId).toBe('col-2');

    const board = await request(app).get('/');
    expect(board.text).toContain('Cartão para mover');
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards/id-inexistente/move').send({ columnId: 'col-2' });

    expect(response.status).toBe(404);
  });

  it('responde 404 se a coluna destino não existe', async () => {
    const repositories = buildTestRepositories();
    const card = Card.create('Cartão parado', 'col-1');
    repositories.cardRepository.save(card);
    const app = createServer(repositories);

    const response = await request(app)
      .post(`/cards/${card.id}/move`)
      .send({ columnId: 'col-inexistente' });

    expect(response.status).toBe(404);
    expect(repositories.cardRepository.findById(card.id)?.columnId).toBe('col-1');
  });
});

describe('POST /cards/:id/update (Atividade 3)', () => {
  it('edita título, descrição e prioridade e redireciona para /', async () => {
    const repositories = buildTestRepositories();
    const card = Card.create('Cartão original', 'col-1', 'baixa', 'desc original');
    repositories.cardRepository.save(card);
    const app = createServer(repositories);

    const response = await request(app)
      .post(`/cards/${card.id}/update`)
      .send({ title: 'Cartão editado', description: 'nova desc', priority: 'alta' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');

    const updated = repositories.cardRepository.findById(card.id);
    expect(updated?.title).toBe('Cartão editado');
    expect(updated?.description).toBe('nova desc');
    expect(updated?.priority).toBe('alta');

    const board = await request(app).get('/');
    expect(board.text).toContain('Cartão editado');
    expect(board.text).toContain('nova desc');
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app)
      .post('/cards/id-inexistente/update')
      .send({ title: 'Editado' });

    expect(response.status).toBe(404);
  });

  it('rejeita título com menos de 3 caracteres com 400', async () => {
    const repositories = buildTestRepositories();
    const card = Card.create('Cartão intacto', 'col-1');
    repositories.cardRepository.save(card);
    const app = createServer(repositories);

    const response = await request(app)
      .post(`/cards/${card.id}/update`)
      .send({ title: 'ab' });

    expect(response.status).toBe(400);
    expect(repositories.cardRepository.findById(card.id)?.title).toBe('Cartão intacto');
  });

  it('atualiza só a descrição quando o título não é enviado', async () => {
    const repositories = buildTestRepositories();
    const card = Card.create('Título fixo', 'col-1', 'baixa', 'desc antiga');
    repositories.cardRepository.save(card);
    const app = createServer(repositories);

    const response = await request(app)
      .post(`/cards/${card.id}/update`)
      .send({ description: 'desc nova' });

    expect(response.status).toBe(302);
    const updated = repositories.cardRepository.findById(card.id);
    expect(updated?.title).toBe('Título fixo');
    expect(updated?.description).toBe('desc nova');
  });
});

describe('POST /cards/:id/delete (Atividade 4)', () => {
  it('remove o cartão e redireciona para /', async () => {
    const repositories = buildTestRepositories();
    const card = Card.create('Cartão a excluir', 'col-1');
    repositories.cardRepository.save(card);
    const app = createServer(repositories);

    const response = await request(app).post(`/cards/${card.id}/delete`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
    expect(repositories.cardRepository.findById(card.id)).toBeUndefined();

    const board = await request(app).get('/');
    expect(board.text).not.toContain('Cartão a excluir');
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/cards/id-inexistente/delete');

    expect(response.status).toBe(404);
  });
});

describe('POST /cards — regras de negócio (Atividades 5 e 6)', () => {
  it('impede título duplicado na mesma coluna com 409', async () => {
    const repositories = buildTestRepositories();
    repositories.cardRepository.save(Card.create('Título único', 'col-1'));
    const app = createServer(repositories);

    const response = await request(app).post('/cards').send({ title: 'título único', columnId: 'col-1' });

    expect(response.status).toBe(409);
  });

  it('permite o mesmo título em colunas diferentes', async () => {
    const repositories = buildTestRepositories();
    repositories.cardRepository.save(Card.create('Título compartilhado', 'col-1'));
    const app = createServer(repositories);

    const response = await request(app)
      .post('/cards')
      .send({ title: 'Título compartilhado', columnId: 'col-2' });

    expect(response.status).toBe(302);
  });

  it('responde 409 se a coluna já atingiu o limite de WIP', async () => {
    const repositories = buildWipTestRepositories();
    repositories.cardRepository.save(Card.create('Já ocupa o limite', 'col-limited'));
    const app = createServer(repositories);

    const response = await request(app)
      .post('/cards')
      .send({ title: 'Não cabe', columnId: 'col-limited' });

    expect(response.status).toBe(409);
  });
});

describe('POST /cards/:id/move — WIP (Atividade 5)', () => {
  it('responde 409 se a coluna destino já atingiu o limite de WIP', async () => {
    const repositories = buildWipTestRepositories();
    const occupant = Card.create('Ocupa o limite', 'col-limited');
    const moving = Card.create('Vai tentar entrar', 'col-1');
    repositories.cardRepository.save(occupant);
    repositories.cardRepository.save(moving);
    const app = createServer(repositories);

    const response = await request(app)
      .post(`/cards/${moving.id}/move`)
      .send({ columnId: 'col-limited' });

    expect(response.status).toBe(409);
    expect(repositories.cardRepository.findById(moving.id)?.columnId).toBe('col-1');
  });

  it('permite mover o cartão para a mesma coluna sem recontar o WIP', async () => {
    const repositories = buildWipTestRepositories();
    const card = Card.create('Já está no limite', 'col-limited');
    repositories.cardRepository.save(card);
    const app = createServer(repositories);

    const response = await request(app).post(`/cards/${card.id}/move`).send({ columnId: 'col-limited' });

    expect(response.status).toBe(302);
  });
});

describe('POST /cards/:id/update — título duplicado (Atividade 6)', () => {
  it('responde 409 se o novo título já existe na mesma coluna', async () => {
    const repositories = buildTestRepositories();
    const existing = Card.create('Título ocupado', 'col-1');
    const editing = Card.create('Outro cartão', 'col-1');
    repositories.cardRepository.save(existing);
    repositories.cardRepository.save(editing);
    const app = createServer(repositories);

    const response = await request(app)
      .post(`/cards/${editing.id}/update`)
      .send({ title: 'título ocupado' });

    expect(response.status).toBe(409);
    expect(repositories.cardRepository.findById(editing.id)?.title).toBe('Outro cartão');
  });
});

describe('GET /cards/:id (Atividade 8)', () => {
  it('renderiza a página de detalhe do cartão', async () => {
    const repositories = buildTestRepositories();
    const card = Card.create('Cartão detalhe', 'col-1', 'alta', 'desc do detalhe');
    repositories.cardRepository.save(card);
    const app = createServer(repositories);

    const response = await request(app).get(`/cards/${card.id}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Cartão detalhe');
    expect(response.text).toContain('desc do detalhe');
    expect(response.text).toContain('alta');
    expect(response.text).toContain('Coluna 1');
  });

  it('responde 404 se o cartão não existe', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).get('/cards/id-inexistente');

    expect(response.status).toBe(404);
  });
});

describe('GET /cards/search (Atividade 9)', () => {
  it('retorna só os cartões cujo título combina com o termo', async () => {
    const repositories = buildTestRepositories();
    repositories.cardRepository.save(Card.create('Configurar ambiente', 'col-1'));
    repositories.cardRepository.save(Card.create('Mover cartão', 'col-2'));
    const app = createServer(repositories);

    const response = await request(app).get('/cards/search').query({ query: 'config' });

    expect(response.status).toBe(200);
    expect(response.text).toContain('Configurar ambiente');
    expect(response.text).not.toContain('Mover cartão');
  });

  it('termo vazio retorna todos os cartões', async () => {
    const repositories = buildTestRepositories();
    repositories.cardRepository.save(Card.create('Primeiro cartão', 'col-1'));
    repositories.cardRepository.save(Card.create('Segundo cartão', 'col-2'));
    const app = createServer(repositories);

    const response = await request(app).get('/cards/search').query({ query: '' });

    expect(response.status).toBe(200);
    expect(response.text).toContain('Primeiro cartão');
    expect(response.text).toContain('Segundo cartão');
  });

  it('sem query string também retorna todos os cartões', async () => {
    const repositories = buildTestRepositories();
    repositories.cardRepository.save(Card.create('Avulso na busca', 'col-1'));
    const app = createServer(repositories);

    const response = await request(app).get('/cards/search');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Avulso na busca');
  });
});

describe('Cartões em múltiplos quadros (Atividade 11)', () => {
  it('POST /boards/board-1/cards redireciona para / (quadro default)', async () => {
    const app = createServer(buildMultiBoardRepositories());

    const response = await request(app)
      .post('/boards/board-1/cards')
      .send({ title: 'No default via URL', columnId: 'col-1' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');
  });

  it('cria cartão no quadro informado e não vaza para o quadro default', async () => {
    const repositories = buildMultiBoardRepositories();
    const app = createServer(repositories);

    const response = await request(app)
      .post('/boards/board-2/cards')
      .send({ title: 'Só no extra', columnId: 'col-a' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/boards/board-2');

    const extra = await request(app).get('/boards/board-2');
    expect(extra.text).toContain('Só no extra');

    const home = await request(app).get('/');
    expect(home.text).not.toContain('Só no extra');
  });

  it('responde 404 ao criar cartão num quadro inexistente', async () => {
    const app = createServer(buildMultiBoardRepositories());

    const response = await request(app)
      .post('/boards/ghost/cards')
      .send({ title: 'Órfão', columnId: 'col-a' });

    expect(response.status).toBe(404);
  });

  it('não encontra cartão de outro quadro nas rotas com :boardId', async () => {
    const repositories = buildMultiBoardRepositories();
    const card = Card.create('Do quadro 1', 'col-1', 'baixa', '', 'board-1');
    repositories.cardRepository.save(card);
    const app = createServer(repositories);

    const detail = await request(app).get(`/boards/board-2/cards/${card.id}`);
    const update = await request(app).post(`/boards/board-2/cards/${card.id}/update`).send({ title: 'Hack' });
    const move = await request(app).post(`/boards/board-2/cards/${card.id}/move`).send({ columnId: 'col-a' });
    const del = await request(app).post(`/boards/board-2/cards/${card.id}/delete`);

    expect(detail.status).toBe(404);
    expect(update.status).toBe(404);
    expect(move.status).toBe(404);
    expect(del.status).toBe(404);
    expect(repositories.cardRepository.findById(card.id)?.title).toBe('Do quadro 1');
  });

  it('move, edita, detalha e exclui no quadro correto', async () => {
    const repositories = buildMultiBoardRepositories();
    const card = Card.create('Vida no extra', 'col-a', 'baixa', 'desc', 'board-2');
    repositories.cardRepository.save(card);
    repositories.boardRepository.findById('board-2')?.addColumn('Próximo');
    const nextId = repositories.boardRepository.findById('board-2')!.columns[1].id;
    const app = createServer(repositories);

    const moved = await request(app)
      .post(`/boards/board-2/cards/${card.id}/move`)
      .send({ columnId: nextId });
    expect(moved.status).toBe(302);
    expect(moved.headers.location).toBe('/boards/board-2');

    const updated = await request(app)
      .post(`/boards/board-2/cards/${card.id}/update`)
      .send({ title: 'Vida editada' });
    expect(updated.status).toBe(302);

    const detail = await request(app).get(`/boards/board-2/cards/${card.id}`);
    expect(detail.status).toBe(200);
    expect(detail.text).toContain('Vida editada');

    const search = await request(app).get('/boards/board-2/cards/search').query({ query: 'vida' });
    expect(search.status).toBe(200);
    expect(search.text).toContain('Vida editada');

    const removed = await request(app).post(`/boards/board-2/cards/${card.id}/delete`);
    expect(removed.status).toBe(302);
    expect(removed.headers.location).toBe('/boards/board-2');
    expect(repositories.cardRepository.findById(card.id)).toBeUndefined();
  });

  it('busca scoped ao quadro não lista cartões de outro quadro', async () => {
    const repositories = buildMultiBoardRepositories();
    repositories.cardRepository.save(Card.create('Comum board1', 'col-1', 'baixa', '', 'board-1'));
    repositories.cardRepository.save(Card.create('Comum board2', 'col-a', 'baixa', '', 'board-2'));
    const app = createServer(repositories);

    const response = await request(app).get('/boards/board-2/cards/search').query({ query: '' });

    expect(response.text).toContain('Comum board2');
    expect(response.text).not.toContain('Comum board1');
  });
});

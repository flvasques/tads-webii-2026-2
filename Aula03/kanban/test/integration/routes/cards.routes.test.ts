import { describe, expect, it, test } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../src/server.js';
import { Card } from '../../../src/cards/Card.js';
import { buildTestRepositories } from '../../helpers/fixtures.js';

/**
 * Estas rotas ainda não fazem nada além de responder 501 — é o
 * comportamento CORRETO do estado inicial do template. Conforme vocês
 * implementam cada atividade, substituam o teste "responde 501" pelos
 * `test.todo` correspondentes (já escritos abaixo como checklist).
 */
describe('Rotas de cartões — estado inicial (não implementado)', () => {
  it('POST /cards/:id/update responde 501 (Atividade 3)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).post('/cards/qualquer-id/update').send({ title: 'Editado' });
    expect(response.status).toBe(501);
  });

  it('POST /cards/:id/delete responde 501 (Atividade 4)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).post('/cards/qualquer-id/delete');
    expect(response.status).toBe(501);
  });

  it('GET /cards/:id responde 501 (Atividade 8, estica)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).get('/cards/qualquer-id');
    expect(response.status).toBe(501);
  });

  it('GET /cards/search responde 501 (Atividade 9, estica)', async () => {
    const app = createServer(buildTestRepositories());
    const response = await request(app).get('/cards/search').query({ query: 'termo' });
    expect(response.status).toBe(501);
  });
});

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

describe('Checklist de comportamento esperado (implementar junto com cada atividade)', () => {
  test.todo('POST /cards impede título duplicado na mesma coluna com 409 (Atividade 6)');

  test.todo('POST /cards/:id/move responde 409 se a coluna destino já atingiu o limite de WIP (Atividade 5)');

  test.todo('POST /cards/:id/update edita título/descrição/prioridade e redireciona para /');
  test.todo('POST /cards/:id/update responde 404 se o cartão não existe');

  test.todo('POST /cards/:id/delete remove o cartão e redireciona para /');
  test.todo('POST /cards/:id/delete responde 404 se o cartão não existe');

  test.todo('GET /cards/:id renderiza a página de detalhe do cartão (Atividade 8)');
  test.todo('GET /cards/search?query=termo retorna só os cartões cujo título combina (Atividade 9)');
});

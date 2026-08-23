import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../src/server.js';
import { buildMultiBoardRepositories, buildTestRepositories } from '../../helpers/fixtures.js';

describe('GET /', () => {
  it('renderiza o quadro com suas colunas', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.text).toContain('Quadro de Teste');
    expect(response.text).toContain('Coluna 1');
    expect(response.text).toContain('Coluna 2');
  });
});

describe('POST /columns (Atividade 7)', () => {
  it('cria uma coluna e redireciona para /', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/columns').send({ name: 'Nova Coluna', wipLimit: 2 });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');

    const board = await request(app).get('/');
    expect(board.text).toContain('Nova Coluna');
  });

  it('rejeita nome com menos de 2 caracteres com 400', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/columns').send({ name: 'A' });

    expect(response.status).toBe(400);
  });

  it('rejeita nome duplicado com 409', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/columns').send({ name: 'coluna 1' });

    expect(response.status).toBe(409);
  });

  it('cria coluna sem wipLimit', async () => {
    const app = createServer(buildTestRepositories());

    const response = await request(app).post('/columns').send({ name: 'Sem limite' });

    expect(response.status).toBe(302);
    const board = await request(app).get('/');
    expect(board.text).toContain('Sem limite');
  });
});

describe('Múltiplos quadros (Atividade 11)', () => {
  it('GET /boards/:boardId renderiza o quadro pedido', async () => {
    const app = createServer(buildMultiBoardRepositories());

    const response = await request(app).get('/boards/board-2');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Outro Quadro');
    expect(response.text).toContain('Ideias');
    expect(response.text).not.toContain('Coluna 1');
  });

  it('GET /boards/:boardId responde 404 se o quadro não existe', async () => {
    const app = createServer(buildMultiBoardRepositories());

    const response = await request(app).get('/boards/board-inexistente');

    expect(response.status).toBe(404);
  });

  it('POST /boards/:boardId/columns cria coluna no quadro e redireciona para ele', async () => {
    const app = createServer(buildMultiBoardRepositories());

    const response = await request(app).post('/boards/board-2/columns').send({ name: 'Backlog' });

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/boards/board-2');

    const board = await request(app).get('/boards/board-2');
    expect(board.text).toContain('Backlog');
  });
});

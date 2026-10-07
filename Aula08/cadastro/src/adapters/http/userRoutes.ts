import { Router } from 'express';
import { InvalidUserDataError } from '../../domain/errors.js';
import type { ListUsers } from '../../application/useCases/ListUsers.js';
import type { RegisterUser } from '../../application/useCases/RegisterUser.js';
import type { VerifyUser } from '../../application/useCases/VerifyUser.js';

/**
 * HEXAGONAL: adaptador primário (driving). Fino de propósito: valida o
 * FORMATO da requisição (são strings?), chama o caso de uso e devolve a
 * resposta. Regras de negócio (e-mail válido, código correto) ficam no
 * domínio. Erros sobem para o `errorHandler` — o Express 5 captura
 * exceções de handlers `async` automaticamente.
 */
export function createUserRoutes(useCases: {
  registerUser: RegisterUser;
  verifyUser: VerifyUser;
  listUsers: ListUsers;
}): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const { name, email } = requireStrings(req.body, ['name', 'email']);
    const user = await useCases.registerUser.execute({ name, email });
    res.status(201).json(user);
  });

  router.post('/verify', async (req, res) => {
    const { email, code } = requireStrings(req.body, ['email', 'code']);
    const result = await useCases.verifyUser.execute({ email, code });
    res.json(result);
  });

  router.get('/', async (_req, res) => {
    res.json(await useCases.listUsers.execute());
  });

  return router;
}

function requireStrings<K extends string>(body: unknown, keys: K[]): Record<K, string> {
  const data = (body ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    if (typeof data[key] !== 'string') {
      throw new InvalidUserDataError(`"${key}" é obrigatório e deve ser texto`);
    }
  }
  return data as Record<K, string>;
}

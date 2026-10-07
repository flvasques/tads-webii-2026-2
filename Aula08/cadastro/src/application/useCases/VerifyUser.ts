import { UserNotFoundError } from '../../domain/errors.js';
import type { UserRepository } from '../ports/UserRepository.js';

/**
 * HEXAGONAL: caso de uso. Busca o usuário, delega a regra para a
 * entidade (`user.verify`) e persiste o novo estado. A regra "o código
 * precisa bater e só vale uma vez" está no domínio, não aqui.
 */
export class VerifyUser {
  constructor(private readonly users: UserRepository) {}

  async execute(input: { email: string; code: string }): Promise<{ email: string; verified: boolean }> {
    const user = await this.users.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new UserNotFoundError(input.email);
    }

    user.verify(input.code);
    await this.users.save(user);

    return { email: user.email, verified: user.verified };
  }
}

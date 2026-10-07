import type { UserRepository } from '../ports/UserRepository.js';

/**
 * HEXAGONAL: caso de uso de leitura. Devolve um objeto simples (DTO) em
 * vez da entidade, para que o código de verificação nunca saia do núcleo.
 */
export class ListUsers {
  constructor(private readonly users: UserRepository) {}

  async execute(): Promise<{ name: string; email: string; verified: boolean }[]> {
    const users = await this.users.findAll();

    // mapeia só que que deve ser mostrado (model view / response)
    return users.map((u) => ({ name: u.name, email: u.email, verified: u.verified }));
  }
}

import type { User } from '../../domain/User.js';
import type { UserRepository } from '../../application/ports/UserRepository.js';

/**
 * HEXAGONAL: adaptador secundário (driven). Implementa `UserRepository`
 * com um `Map`. Trocar por Prisma = escrever `PrismaUserRepository` e
 * mudar UMA linha em `src/index.ts`.
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.get(email);
  }

  async findAll(): Promise<User[]> {
    return [...this.users.values()];
  }

  async save(user: User): Promise<void> {
    this.users.set(user.email, user);
  }
}

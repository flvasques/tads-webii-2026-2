import type { User } from '../../domain/User.js';

/**
 * HEXAGONAL: porta de saída (driven port). Os métodos são assíncronos
 * mesmo com a implementação em memória: assim um futuro adaptador Prisma
 * encaixa sem mudar nenhum caso de uso.
 */
export interface UserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
}

import { User } from '../../domain/User.js';
import { EmailAlreadyRegisteredError } from '../../domain/errors.js';
import type { CodeGenerator } from '../ports/CodeGenerator.js';
import type { EmailSender } from '../ports/EmailSender.js';
import type { UserRepository } from '../ports/UserRepository.js';

/**
 * HEXAGONAL: caso de uso (porta de entrada). Orquestra o cadastro:
 * gera o código, cria a entidade, envia o e-mail e salva — tudo por meio
 * de interfaces. Ele não sabe se o e-mail vai para o console ou para um
 * servidor SMTP; quem decide isso é a composition root (`src/index.ts`).
 */
export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly emailSender: EmailSender,
    private readonly codeGenerator: CodeGenerator,
  ) {}

  async execute(input: { name: string; email: string }): Promise<{ name: string; email: string; verified: boolean }> {
    const code = this.codeGenerator.generate();
    
    // dominio - regra de negocio
    const user = User.create(input.name, input.email, code);

    // operacao do use case
    if (await this.users.findByEmail(user.email)) {
      throw new EmailAlreadyRegisteredError(user.email);
    }

    // Envia ANTES de salvar: se o envio falhar, nada é persistido e o
    // usuário pode simplesmente tentar se cadastrar de novo.
    await this.emailSender.sendVerificationCode(user, code);
    await this.users.save(user);

    return { name: user.name, email: user.email, verified: user.verified };
  }
}

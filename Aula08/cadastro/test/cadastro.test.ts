import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RegisterUser } from '../src/application/useCases/RegisterUser.js';
import { VerifyUser } from '../src/application/useCases/VerifyUser.js';
import type { EmailSender } from '../src/application/ports/EmailSender.js';
import { InMemoryUserRepository } from '../src/adapters/memory/InMemoryUserRepository.js';
import { EmailAlreadyRegisteredError, InvalidVerificationCodeError } from '../src/domain/errors.js';

// Dublês das portas: sem SMTP, sem aleatoriedade, sem HTTP.
const fixedCode = { generate: () => '123456' };

class SpyEmailSender implements EmailSender {
  sent: { email: string; code: string }[] = [];
  async sendVerificationCode(to: { email: string }, code: string): Promise<void> {
    this.sent.push({ email: to.email, code });
  }
}

function setup() {
  const users = new InMemoryUserRepository();
  const email = new SpyEmailSender();
  return {
    email,
    register: new RegisterUser(users, email, fixedCode),
    verify: new VerifyUser(users),
  };
}

test('cadastro envia o código por e-mail e o usuário começa não verificado', async () => {
  const { register, email } = setup();
  const user = await register.execute({ name: 'Ana', email: 'ana@ifrs.edu.br' });

  assert.equal(user.verified, false);
  assert.deepEqual(email.sent, [{ email: 'ana@ifrs.edu.br', code: '123456' }]);
});

test('não permite cadastrar o mesmo e-mail duas vezes', async () => {
  const { register } = setup();
  await register.execute({ name: 'Ana', email: 'ana@ifrs.edu.br' });

  await assert.rejects(register.execute({ name: 'Ana 2', email: 'ANA@ifrs.edu.br' }), EmailAlreadyRegisteredError);
});

test('verifica com o código correto e rejeita o incorreto', async () => {
  const { register, verify } = setup();
  await register.execute({ name: 'Ana', email: 'ana@ifrs.edu.br' });

  await assert.rejects(verify.execute({ email: 'ana@ifrs.edu.br', code: '000000' }), InvalidVerificationCodeError);
  const result = await verify.execute({ email: 'ana@ifrs.edu.br', code: '123456' });
  assert.equal(result.verified, true);
});

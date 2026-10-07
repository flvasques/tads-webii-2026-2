import 'dotenv/config';
import express from 'express';
import type { EmailSender } from './application/ports/EmailSender.js';
import { RegisterUser } from './application/useCases/RegisterUser.js';
import { VerifyUser } from './application/useCases/VerifyUser.js';
import { ListUsers } from './application/useCases/ListUsers.js';
import { InMemoryUserRepository } from './adapters/memory/InMemoryUserRepository.js';
import { RandomCodeGenerator } from './adapters/code/RandomCodeGenerator.js';
import { ConsoleEmailSender } from './adapters/email/ConsoleEmailSender.js';
import { NodemailerEmailSender } from './adapters/email/NodemailerEmailSender.js';
import { createUserRoutes } from './adapters/http/userRoutes.js';
import { errorHandler } from './adapters/http/errorHandler.js';

/**
 * HEXAGONAL: COMPOSITION ROOT. É o único arquivo que:
 *   1. lê `process.env`;
 *   2. conhece os adaptadores concretos;
 *   3. conecta adaptadores -> portas -> casos de uso -> HTTP.
 *
 * A escolha da estratégia de e-mail acontece em `createEmailSender()`:
 * trocar `EMAIL_STRATEGY` no `.env` muda o comportamento da aplicação
 * sem alterar uma linha do domínio nem dos casos de uso.
 */
function createEmailSender(): EmailSender {
  const strategy = process.env.EMAIL_STRATEGY ?? 'console';

  if (strategy === 'console') {
    return new ConsoleEmailSender();
  }
  if (strategy === 'nodemailer') {
    return new NodemailerEmailSender({
      host: process.env.SMTP_HOST ?? '',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.EMAIL_FROM ?? 'Cadastro <no-reply@example.com>',
    });
  }
  throw new Error(`EMAIL_STRATEGY inválida: "${strategy}" (use "console" ou "nodemailer")`);
}

// --- adaptadores secundários ---
const userRepository = new InMemoryUserRepository();
const emailSender = createEmailSender();
const codeGenerator = new RandomCodeGenerator();

// --- casos de uso (recebem só interfaces) ---
const registerUser = new RegisterUser(userRepository, emailSender, codeGenerator);
const verifyUser = new VerifyUser(userRepository);
const listUsers = new ListUsers(userRepository);

// --- adaptador primário HTTP ---
const app = express();
app.use(express.json());
app.use('/users', createUserRoutes({ registerUser, verifyUser, listUsers }));
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3008);
app.listen(PORT, () => {
  console.log(`Cadastro rodando em http://localhost:${PORT} (e-mail: ${emailSender.constructor.name})`);
});

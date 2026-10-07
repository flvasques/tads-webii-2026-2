# Aula 08 — Cadastro com verificação por e-mail em Ports and Adapters

## Objetivo

Ver a arquitetura hexagonal das Aulas 06 e 07 aplicada desde o início num projeto pequeno: um cadastro de usuários com confirmação por código enviado por e-mail. O foco é mostrar como **trocar a estratégia de envio de e-mail (console ↔ Nodemailer) só pela configuração**, sem tocar no domínio nem nos casos de uso.

## Material desta pasta

[`cadastro/`](cadastro/) — API em TypeScript e Express, organizada em domínio, portas, casos de uso e adaptadores, com duas estratégias de envio de e-mail escolhidas pelo `.env`.

```bash
cd cadastro
cp .env.example .env
npm install
npm run dev              # http://localhost:3008
npm test
```

O [`README.md`](cadastro/README.md) do projeto descreve a API e traz um **roteiro de leitura** do código, de dentro para fora do hexágono, uma demonstração para fazer em aula e exercícios.

Material de conceito: [`../Aula06/arquitetura-hexagonal.md`](../Aula06/arquitetura-hexagonal.md).
Projeto da aula anterior: [`../Aula07/notificacoes/`](../Aula07/notificacoes/).

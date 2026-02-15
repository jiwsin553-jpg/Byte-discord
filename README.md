# Byte Support

Bot Discord profissional para automacao de vendas e suporte tecnico com tickets e FAQ.

## Requisitos
- Node.js 18+
- Permissoes de Intents: Server Members e Message Content

## Instalacao
1. Clone o repositorio
2. Instale dependencias:
   - `npm install`
3. Copie o arquivo `.env.example` para `.env` e preencha:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
4. Ajuste o `config.json` se necessario
5. Inicie o bot:
   - `npm start`

## Canal de voz fixo
Defina `voiceChannelId` no `config.json` para o bot entrar automaticamente no canal ao iniciar.

## Painel automatico de tickets
Defina `ticketPanelChannelId` no `config.json`. O bot publica um painel com botoes para abrir tickets automaticamente.

## Configuracao inicial (/config)
Execute o comando `/config` no servidor com os parametros:
- admin_role: cargo administrador do bot
- support_role: cargo do time de suporte
- sales_category: categoria de tickets de vendas
- support_category: categoria de tickets de suporte
- log_channel: canal para logs
- qr_code: texto ou link do QR Code do PIX

## Como funciona
- O bot detecta palavras-chave em mensagens e cria tickets automaticamente.
- O sistema envia FAQ automaticamente quando detectar termos configurados.
- Fechamento de ticket via botao, com confirmacao e avaliacao (1-5).

## Pagamentos
As informacoes de pagamento ficam em `config.json` e sao exibidas nos tickets de vendas:
- PIX: brunoquirin3@gmail.com
- Banco: Nubank
- Beneficiario: Bruno Quirino

## Permissoes Discord
Conceda ao bot:
- Ler mensagens
- Enviar mensagens
- Gerenciar canais
- Gerenciar mensagens
- Ver canais

## Troubleshooting
- Se o comando /config nao aparecer, aguarde a propagacao dos comandos globais.
- Erros de permissao geralmente sao causados por cargos/categorias incorretas.
- Garanta que o bot tenha permissao para criar canais dentro das categorias.

## Estrutura
```
projeto/
├── commands/
├── events/
├── utils/
├── database/
├── index.js
├── package.json
├── config.json
├── .env.example
└── README.md
```

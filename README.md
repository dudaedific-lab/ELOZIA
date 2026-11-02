# Elozia

RH e departamento pessoal com portal do funcionário, documentos privados, solicitações, comunicação e assistência operacional.

## Executar localmente

Requer Node.js 24.5+ e npm. No diretório do projeto:

```bash
npm ci
npm run dev
```

O comando inicia API e interface. Para servir o build pelo próprio backend:

```bash
npm run build
npm start
```

O ambiente local usa SQLite persistente em `.data/elozia.sqlite` e arquivos privados em `.data/files`. Esses dados não são versionados. O servidor usa por padrão a interface de loopback; não exponha as contas de demonstração na Internet.

### Explorar os perfis

Os botões da tela de login abrem experiências com **dados fictícios**:

| Perfil | E-mail | Senha apenas de demonstração |
|---|---|---|
| RH | marina@exemplo.test | Elozia@2026 |
| Gestor | lucas@exemplo.test | Elozia@2026 |
| Funcionário | beatriz@exemplo.test | Elozia@2026 |

A criação dessas contas só acontece no banco local, fora de produção. Use `DEMO_SEED=false` para iniciar sem elas. A opção “Criar empresa” cria uma organização independente. Dados de teste não representam pessoas reais.

## O que funciona nesta entrega

- Login com cookie HttpOnly, logout, troca de senha e revogação de sessões.
- Empresa, cadastro de funcionários, situação do vínculo e acesso individual ao portal.
- RH com acesso da empresa; gestor com escopo de departamento; funcionário com acesso pessoal.
- Admissão em etapas, convite por link de uso único/48 horas, formulário e upload, conferência e criação do vínculo/acesso.
- Solicitações de férias, documentos, cadastro e ajustes, com parecer e aprovação por outra pessoa autorizada.
- Upload privado, verificação de tipo, conferência do destinatário e publicação de documentos/holerites.
- Download autenticado e registro de acesso; holerites vêm da folha externa e não são calculados aqui.
- Comunicados, mensagens privadas e registro explícito de leitura.
- Registros de ponto de **teste**, horário recebido no servidor, sequência, hash encadeado, idempotência e histórico imutável. Inclusões aprovadas são separadas dos originais.
- Soma de intervalos fechados e acompanhamento das marcações. Não é cálculo de direitos, horas extras, saldo legal ou banco de horas.
- Assistente com resumo por regras. Com um provedor configurado, respostas por IA usam totais autorizados, sem acesso de escrita e sem envio de arquivos.
- Histórico de atividades e layout responsivo.

## Supabase da Elozia

Projeto: `skgdyvjhbxotiqgflzke`. Este repositório contém uma migration **ainda não aplicada ao projeto remoto**.

A arquitetura atual usa um backend Node para autenticação e autorização; não usa Supabase Auth no navegador. PostgreSQL fica em um schema privado `elozia`, com acesso negado a `anon`/`authenticated` e RLS sem policies permissivas. A conexão de serviço do backend aplica as regras de autorização e os filtros por empresa. Ela nunca é enviada ao navegador.

1. Obtenha a URL PostgreSQL do pooler deste projeto e configure `DATABASE_URL` com segurança no servidor. Não cole a senha em chat, commits ou arquivos públicos. A URL deve conter o project ref da Elozia. Caracteres especiais na senha precisam estar codificados na URL.
2. Configure `ELOZIA_PROJECT_REF=skgdyvjhbxotiqgflzke`.
3. Revise `supabase/migrations/202611020001_elozia_foundation.sql`.
4. Execute `npm run db:prepare` para aplicar a migration explicitamente.
5. Inicie o backend. No modo PostgreSQL não há seed automático de demonstração.

TLS é verificado. Se o provedor exigir uma CA, configure a cadeia de confiança; não desative a verificação. A rede do ambiente também precisa permitir o host/porta reais do pooler. A conexão remota não foi validada nesta entrega por ausência de credenciais/rede TCP configuradas.

Uploads usam diretório privado local, inclusive no modo PostgreSQL. Uma implantação necessita volume persistente com backup ou um adaptador de armazenamento privado; não hospede em filesystem efêmero. Defina `FILES_DIRECTORY` no servidor. O banco remoto sozinho não migra arquivos locais.

## IA opcional

Configure no servidor `AI_API_KEY`, `AI_MODEL` e, se necessário, `AI_BASE_URL` (interface compatível com chat completions). O padrão é OpenAI com `gpt-4.1-mini`. Não há chave no frontend.

Sem chave ou se o provedor falhar, a aplicação mantém o resumo por regras e informa esse modo. Pedidos reconhecidos como clínicos/salariais não são enviados ao provedor; isso não substitui uma política completa de prevenção de perda de dados. O assistente não aprova, altera registros, lê documentos ou calcula direitos. Não há OCR, consulta a políticas internas ou extração por IA implementados nesta versão.

O processo respeita proxy via `--use-env-proxy`. Avalie retenção e condições do provedor antes de habilitar dados reais.

## Testar

```bash
npm test
npm run build
CHROME_PATH=/usr/bin/chromium npm run test:e2e
```

- Testes da API: sessões, empresa, perfis, documentos, marcações, solicitações, convites e imutabilidade.
- Testes PostgreSQL com PGlite: execução da migration e operações reais, permissões de schema e RLS. Não substituem validação no Supabase remoto.
- Chromium: RH → cadastro com portal → holerite conferido → funcionário consulta → marcação de teste → solicitação aprovada, além de navegação e layout móvel.
- Capturas de tela são geradas em `test-results/` e não entram no Git.

## Limite do módulo de ponto

**Não oferecer esta versão como REP-P ou PTRP em conformidade.** Não há AFD/AEJ, assinatura exigida, comprovante oficial, registro INPI verificado, motor completo de jornadas/banco de horas ou evidências regulatórias. O arquivo de registro de teste é JSON técnico, não comprovante oficial. Os próximos requisitos estão em [PONTO.md](docs/PONTO.md).

## Próximas entregas e implantação

Veja [o estado verificável desta entrega](docs/ENTREGA.md) e [a arquitetura](docs/ARQUITETURA.md). Assinaturas eletrônicas, entrega de e-mails, folha própria, férias com cálculo legal, MFA, recuperação de senha e integração Thirdia não estão implementados.

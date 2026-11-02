# Publicar a Elozia na Vercel

A interface e a API Node são publicadas juntas. O banco é o PostgreSQL do projeto Supabase Elozia e os arquivos ficam em bucket privado no Supabase Storage. Não usar SQLite ou filesystem da função Vercel para dados permanentes.

## 1. Importar o repositório

Entre em https://vercel.com/new com sua conta. Escolha a organização GitHub `dudaedific-lab` e importe `ELOZIA`. Se ele não aparecer, conceda à integração GitHub da Vercel acesso a esse repositório.

- Framework: Vite (detectado por vercel.json).
- Root Directory: raiz do repositório.
- Node.js: 24.x.
- Build Command: `npm run vercel:build` (definido no repositório).
- Output Directory: `dist`.

O build compila a interface, aplica explicitamente a migration inicial idempotente do schema privado `elozia` e cria/verifica o bucket privado. Não gera contas de demonstração remotas. Revisar a migration antes de iniciar o deploy. O botão Deploy autoriza essas etapas no projeto indicado pelas variáveis.

## 2. Variáveis de ambiente

Configure nos campos de Environment Variables da Vercel, com acesso restrito à equipe autorizada. A URL do banco e a chave de serviço são segredos; não colocar no GitHub, chat ou variáveis `VITE_*`.

| Nome | Valor |
|---|---|
| `DATABASE_URL` | Connection string do **Session Pooler** do projeto Supabase Elozia. Copiar de Connect no Supabase, preencher a senha e codificar caracteres especiais. O usuário da URL deve conter `.skgdyvjhbxotiqgflzke`. Preferir modo Session, porta 5432, para esta arquitetura. |
| `ELOZIA_PROJECT_REF` | `skgdyvjhbxotiqgflzke` |
| `STORAGE_DRIVER` | `supabase` |
| `SUPABASE_URL` | `https://skgdyvjhbxotiqgflzke.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço server-side do mesmo projeto, disponível nas configurações de API Keys do Supabase. Nunca usar anon/publishable nesse campo. |
| `SUPABASE_STORAGE_BUCKET` | `elozia-documents` (padrão se omitido) |

Se a conexão TLS exigir a CA do banco, obtenha o certificado oficial no Supabase e configure `SUPABASE_DB_CA` com o PEM. Mantenha verificação TLS ativa. Não contorne erro de certificado com `rejectUnauthorized=false` ou `NODE_TLS_REJECT_UNAUTHORIZED=0`.

Para habilitar IA posteriormente: `AI_API_KEY`, `AI_MODEL` e, se necessário, `AI_BASE_URL`. Isso é opcional para publicar o restante.

Ao usar previews, escolha conscientemente a quais ambientes dar as credenciais. Não conectar um preview experimental a um banco com dados reais sem isolamento apropriado. O projeto atual é uma entrega inicial de piloto.

## 3. Publicar e verificar

Clique Deploy e acompanhe o build. A URL só existe depois que a Vercel confirmar o deployment; não presumir que `elozia.vercel.app` estará disponível.

Depois do deploy:

1. Abra o endereço gerado e confirme que a tela inicial aparece.
2. Consulte `/api/health`: deve indicar `storage: postgres`, `demo: false`, `officialTimekeeping: false`.
3. Use “Criar empresa” para cadastrar o primeiro ambiente de teste com dados fictícios. A autenticação desta versão é do backend; não é preciso criar o usuário no painel Supabase Auth.
4. Cadastre um funcionário com acesso ao portal, envie um documento administrativo fictício, confira e publique.
5. Entre como esse funcionário e verifique a leitura e o download.
6. Teste uma solicitação e a decisão pelo RH. Não utilizar ponto para registro oficial.

Compartilhe apenas a URL pública resultante para validação. Não compartilhar chaves, senha do banco ou variáveis privadas.

## Características da adaptação

- `/api/*` é encaminhado a uma única função Node, preservando caminho, parâmetros e body JSON.
- As sessões usam cookies HttpOnly e Secure em produção.
- PostgreSQL usa schema privado, filtros de empresa no backend, RLS e bloqueio de alterações do histórico.
- O Storage usa chave de serviço exclusivamente no servidor; acesso ao arquivo passa pela autorização da API e pelo registro de acesso.
- Buckets públicos são recusados. Não há URL pública de holerite.
- Upload administrativo: até 2 MB. Convite: até 3 arquivos somando 2 MB, para ficar abaixo do limite de payload da função serverless.
- O resultado de publicação na Vercel, a conexão ao banco real e o Storage real ainda precisam ser verificados com as credenciais da conta. Testes locais de adaptador e transporte não comprovam deploy externo.

## Diagnóstico sem expor segredos

- Build informa DATABASE_URL ausente: configure a variável no ambiente escolhido e faça novo deploy.
- Guard de projeto recusa: confira ELOZIA_PROJECT_REF e a connection string; não apontar ao GD5/Thirdia.
- Conexão recusada: confira senha, Session Pooler, host/porta e política de rede do Supabase.
- Erro de certificado: configure a CA oficial do banco, mantendo verificação.
- Falha no bucket: confira chave server-side, URL do projeto e privacidade do bucket.
- API retorna 503: configuração ou preparação do banco/Storage não foi concluída. Examine os logs da função sem divulgar credenciais.

A publicação para teste não conclui a conformidade de ponto, MFA, recuperação de senha ou demais itens listados em ENTREGA.md. Comece com dados fictícios.

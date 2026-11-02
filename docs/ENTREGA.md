# Primeira versão funcional — Elozia

Data: 02/11/2026. Entrega executável local, não implantação pública.

## Evidências

- Build TypeScript/Vite executado.
- 27 testes aprovados da API e da migration PostgreSQL com banco local.
- Nove fluxos completos no Chromium, incluindo layout móvel e zero erros JavaScript no último run concluído.
- Auditoria npm de produção: zero vulnerabilidades reportadas na consulta desta entrega.
- Persistência local e acesso privado a arquivos. A configuração real do Supabase ainda não foi validada.

Os testes geram bancos isolados em diretórios temporários; não executam operações no Supabase real nem no GD5.

## Pronto para explorar

RH, gestor e funcionário; cadastros; vínculo; empresa; admissão por convite; documentos; entrega de holerite importado; mensagens; solicitações com parecer; ponto de teste; consulta de registros; assistente operacional; auditoria; layout móvel.

## Integrações pendentes

- PostgreSQL do Supabase: código/migration preparados, sem credenciais de conexão nesta sessão.
- IA externa: adaptador implementado; sem chave, opera e se identifica como resumo por regras. Não houve teste de chamada a provedor real.
- Publicação: não há URL pública ou serviço de hospedagem provisionado.
- Arquivos: armazenamento privado no filesystem; precisa de volume persistente/backup ou adaptação ao Storage antes de uma implantação apropriada.
- E-mail/WhatsApp e assinatura: não conectados; os convites são gerados para compartilhamento manual.
- GitHub: primeira implementação enviada à branch main de dudaedific-lab/ELOZIA. Isso publica o código, não o aplicativo. O resultado do GitHub Actions ainda não foi consultado.

## Lacunas para produção

Ponto oficial ainda não validado nem completo; autenticação sem verificação de e-mail, MFA e recuperação de senha; medidas de operação distribuída a consolidar; plano de retenção e restauração; configuração de armazenamento; revisão de segurança externa e observabilidade. O cadastro por CNPJ ainda não verifica identidade jurídica. Jornada parametrizada completa e cálculo legal de férias/horas/banco não estão entregues.

Admissão é um fluxo básico de coleta e conferência administrativa. Não há geração contratual, integração eSocial ou assinatura. Solicitações de férias aprovadas registram a decisão; não calculam direito, saldo ou pagamento nem alteram folha automaticamente.

Permissões nesta versão: RH por empresa, gestor por departamento, funcionário por vínculo. Identidade por e-mail é única e não implementa múltiplos empregadores por login.

## Continuidade

1. Conectar e verificar o projeto Supabase exclusivo da Elozia.
2. Escolher hospedagem do backend e persistência dos arquivos; aplicar controles de produção.
3. Completar a matriz normativa e o motor de ponto.
4. Expandir o assistente para extração administrativa e políticas internas, com testes de qualidade/permissões.
5. Integração Thirdia somente depois, conforme escopo já acordado.

## Empacotamento

Dockerfile de implantação preparado, mas imagem não foi construída nem implantada nesta sessão. Exige DATABASE_URL do projeto Elozia, migration aplicada, volume persistente em /data, HTTPS na borda e os controles pendentes acima. O ponto continua de teste mesmo em uma imagem de produção.

Instalação limpa pelo package-lock (`npm ci`) e build foram exercitados. O Dockerfile não foi construído.

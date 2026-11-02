# Elozia — RH, departamento pessoal e ponto

Documento inicial de arquitetura e execução — 02/11/2026.
Nome do produto: Elozia. Este documento registra decisões de projeto; não representa software implementado ou conformidade regulatória verificada.

## 1. Objetivo e decisões já tomadas

Criar um aplicativo independente que reduza o trabalho operacional do RH. Funcionários resolvem solicitações pelo portal; regras conduzem rotinas; IA interpreta, prepara e explica; responsáveis decidem as exceções.

Referências: exploração do QuarkRH e duas pesquisas da Sólides fornecidas pelo usuário. Alegações de fornecedores não são requisitos legais nem funcionalidades verificadas por esta equipe.

Escopo principal: RH/DP, portal do funcionário e gestor, documentos administrativos, holerites importados, comunicação, solicitações e ponto eletrônico próprio. Ponto é requisito do produto, com atendimento à regulamentação aplicável desde o desenho. TST/SST pertence ao Thirdia, cuja integração ficará para uma fase posterior.

Não construir agora folha de pagamento própria, motor de decisões médicas, previsão de desligamento, avaliação comportamental, reconhecimento facial ou conector Thirdia. Férias e afastamentos administrativos fazem parte do RH; conteúdo clínico exige um caminho restrito e não será enviado para a IA generalista.

## 2. Experiências do produto

### Funcionário — área pessoal

Início com jornada do dia, acesso à marcação de ponto, pendências e solicitações. Áreas: Meu ponto; Meus holerites; Meus documentos; Minhas solicitações; Mensagens; Meu cadastro. Pode consultar comprovantes, pedir ajustes e acompanhar decisões. Acesso apenas ao próprio contexto e vínculos autorizados.

O fluxo de ponto precisa permanecer disponível independentemente da disponibilidade da IA. Conversa não substitui comprovante nem registro oficial.

### Gestor — equipe

Fila de ajustes de ponto, pedidos de férias e solicitações atribuídas. Mostra evidências necessárias e motivo da recomendação, sem acesso automático a salário ou conteúdo clínico. Escopo por equipes/unidades e histórico de responsabilidade.

### RH/DP — operação por exceção

Tela inicial “O que precisa de atenção”: admissões incompletas, documentos pendentes, pedidos atrasados, inconsistências de ponto, lotes de holerites a conferir e tarefas com falha. Cada item informa responsável, prazo, motivo, evidência e ação possível.

A interface convencional permanece disponível; o assistente é uma forma adicional de consultar e preparar operações.

### Administração

Empresas legais, estabelecimentos, departamentos, equipes, cargos, usuários, permissões, políticas, regras, modelos documentais, notificações e configurações de IA.

## 3. Arquitetura técnica proposta

Começar com monólito modular: frontend web responsivo, backend com módulos separados e worker de tarefas. Isso reduz complexidade operacional sem misturar os domínios.

Proposta tecnológica inicial, sujeita a prova de compatibilidade do ponto e assinaturas: TypeScript; React na interface; backend Node.js; PostgreSQL; armazenamento privado compatível com S3; fila durável apoiada no banco; adaptadores para identidade, e-mail, assinaturas e modelos de IA. PWA pode melhorar a instalação, mas offline de ponto exige desenho específico e não será prometido na primeira entrega.

Estrutura lógica:

- apps/web: áreas de RH, gestor e funcionário.
- apps/api: autenticação, autorização e operações de domínio.
- apps/worker: processamento de arquivos, notificações e tarefas de IA.
- modules/identity: identidade, sessões e MFA.
- modules/organization: clientes, empresas legais, unidades e estrutura.
- modules/people: pessoas, vínculos e movimentações.
- modules/admission: convites, coleta e conferência.
- modules/documents: arquivos, versões, publicação e assinatura.
- modules/requests: solicitações e aprovações.
- modules/time-recorder: fronteira de registro REP-P proposta.
- modules/time-treatment: tratamento de jornada PTRP proposto.
- modules/payroll-delivery: importação e entrega de holerites.
- modules/communications: comunicados e mensagens.
- modules/assistant: contexto, propostas e ferramentas autorizadas de IA.
- modules/audit: trilha e evidências.

REP-P e PTRP terão interfaces e responsabilidades distintas. A adequação de execução no mesmo backend deverá ser confirmada pela matriz normativa; isolamento de código, sozinho, não comprova conformidade.

## 4. Dados e isolamento

Tenant é o cliente contratante do aplicativo. Um tenant pode administrar vários CNPJs e estabelecimentos. Pertencer ao mesmo tenant não concede automaticamente acesso a todos os CNPJs.

Pessoa é distinta de vínculo de trabalho. Vínculo registra empregador, matrícula, datas e situação. Lotações, cargos, salários quando necessários e jornadas têm histórico de vigência. Funcionário e usuário de login também são entidades distintas.

Entidades centrais:

- tenant, legal_entity, establishment, department, team, position;
- user, membership, role, permission, organizational_scope;
- person, employment, employment_assignment, employment_change;
- admission, admission_invitation, checklist_item, admission_submission;
- document, document_version, document_access, signature_request;
- employee_request, approval_step, approval_decision;
- schedule, schedule_version, schedule_assignment;
- original_punch, punch_receipt, adjustment_request, adjustment_decision;
- calculation_run, daily_result, time_bank_entry, period_closure;
- payroll_import_batch, payslip, publication, access_event;
- conversation, message, announcement, notification;
- ai_job, ai_proposal, action_confirmation, audit_event, outbox_event.

RLS como defesa adicional, além da autorização do backend. Contexto de tenant deve vir de uma associação autenticada, nunca de parâmetro aceito sem validação. Jobs transportam o contexto e o revalidam. Arquivos e índices de busca também precisam de isolamento. CPF e CNPJ não funcionam como credenciais ou autorização de associação.

## 5. IA com ações controladas

IA não recebe acesso SQL livre, credenciais de serviço ou poder de executar operações arbitrárias. Usa ferramentas de domínio com esquema, escopo e autorização próprios.

Fluxo: pedido → identificação do contexto autorizado → consulta mínima de dados → proposta → prévia com impacto → confirmação quando necessária → revalidação → execução pela regra de negócio → auditoria.

A confirmação é vinculada à versão exata da proposta, usuário, alvo e prazo. Alterar proposta ou dados relevantes exige nova confirmação. Repetir a execução não duplica a operação.

Primeiras capacidades:

1. Extração administrativa: preencher rascunhos de cadastro a partir de documentos, destacar origem e divergências. Dados incertos ficam sem preenchimento automático.
2. Assistente de políticas: responder com documentos internos aprovados, versão e referência. Sem fundamento suficiente, encaminhar ao RH. Conteúdo recuperado é dado, não instrução de execução.
3. Triagem de solicitações: sugerir categoria e responsável; regras definem o encaminhamento permitido.
4. Resumo operacional: agrupar pendências e preparar mensagens sem expor dados além do escopo.
5. Ponto assistido: explicar resultados do motor determinístico e resumir exceções; nunca criar marcações, aprovar ajustes ou calcular direitos por geração de texto.

A publicação de holerites, alterações de cadastro sensíveis, concessão de férias, ajustes e fechamento de ponto exigem aprovação de pessoa autorizada. Nem toda tarefa precisa de aprovação manual: lembretes, roteamento previsto em política e notificações podem executar automaticamente com deduplicação.

Dados clínicos ficam fora da IA generalista. Retenção, região de processamento, uso para treinamento e suboperadores devem ser avaliados antes da escolha do provedor. Logs não guardarão documentos completos, senhas ou conteúdo pessoal indiscriminadamente. O produto continua operando se a IA falhar.

## 6. Ponto próprio

Modalidade-alvo a avaliar: REP-P, com tratamento PTRP. O usuário definiu ponto próprio; importar marcações externas não substitui essa entrega.

Antes do desenvolvimento do registrador: elaborar matriz com texto oficial vigente, modalidade, obrigação, componente, evidência e teste. Confirmar requisitos aplicáveis de registro no INPI, documentação técnica, integridade, relógio, sequência, comprovantes, assinaturas e leiautes AFD/AEJ/espelho. Estes itens estão pendentes de verificação normativa; não são declaração de conformidade.

Marcações originais serão preservadas. Solicitações, decisões de ajuste e resultados de cálculo ficam separados dos originais. Cada apuração identifica versões de jornadas e regras; um recálculo cria uma execução rastreável. O tratamento de períodos encerrados deve ser definido com o enquadramento aplicável, sem reescrever evidências históricas.

A marcação não pode depender de autorização do gestor, saldo, existência de justificativa ou disponibilidade da IA. Jornadas e geolocalização não devem ser usadas para bloquear marcações em desacordo com os requisitos aplicáveis. Comportamento em falhas deve ser explícito: nunca afirmar registro confirmado sem confirmação persistida e comprovante correspondente.

O lançamento inicial prevê internet, celular e navegador, desde que compatíveis com os requisitos confirmados. Falhas de conexão terão comunicação clara e procedimento de contingência definido; não haverá marcação offline improvisada. Fuso, instante de registro e apresentação ao usuário precisam ser tratados explicitamente.

Integração com folha será por adaptadores e leiautes acordados. Entrada na obra pelo Thirdia e início da jornada continuam fatos distintos.

## 7. Holerites e documentos

Receber demonstrativos de sistema de folha ou contador, sem criar folha própria no primeiro ciclo. Pipeline: upload privado → verificação de arquivo → separação/identificação → associação proposta ao vínculo e competência → conferência → publicação → notificação → registro de acesso.

Não associar somente por nome. Ambiguidades, múltiplos vínculos, duplicatas ou identificadores incompatíveis bloqueiam a publicação afetada. IA pode sugerir, não liberar associações incertas. Nenhum link público ou documento salarial em notificação.

Registro de visualização é evidência técnica; seu valor jurídico não deve ser apresentado como quitação, assinatura ou aceite automático.

Arquivos usam versões identificadas, checagem de integridade, inspeção de conteúdo e acesso temporário autenticado. Política de retenção distingue documentos, comprovantes, eventos, auditoria e logs técnicos.

## 8. Fluxos prioritários

### Admissão

RH prepara convite → pessoa preenche → sistema verifica obrigatoriedade → IA sugere preenchimento e inconsistências → RH confere → assinatura quando necessária → vínculo concluído. Estados e transições no servidor; nenhum acesso amplo ao sistema pelo link de admissão. Convite revogável, limitado e com prazo.

### Ajuste de ponto

Funcionário consulta original → solicita correção e justifica → gestor recebe → aprova ou devolve → motor recalcula → funcionário acompanha. Todos os passos preservam autoria e evidências. IA ajuda na explicação.

### Solicitação administrativa

Funcionário escolhe categoria → sistema coleta campos mínimos → encaminha por política → responsável decide → informa resultado → audita. Evitar criar conversa sem responsável e sem estado de conclusão.

### Dia do RH

Processador atualiza tarefas → sistema ordena por prazo/impacto verificável → IA prepara resumo → RH abre evidência e resolve exceção → ação conclui e desaparece da fila. O resumo pode falhar sem apagar tarefas.

## 9. Segurança e operação

MFA para papéis privilegiados; permissões mínimas; proteção de sessão; isolamento entre empresas; URLs privadas; backups e restauração testada; limites de upload e requisições; observabilidade sem vazamento de conteúdo.

Auditoria registra ator, escopo, ação, entidade, origem e alterações permitidas, com mascaramento apropriado. Permissão de administrar o produto não implica acesso clínico. Credenciais de serviço ficam apenas no backend.

Outbox transacional para eventos após alterações de negócio; processamento com idempotência, repetição limitada, fila de falhas e reprocessamento autorizado. Mensagens e tarefas precisam de status observável, sem marcar como concluído antes da execução confirmada.

## 10. Plano por marcos, sem estimativas fictícias

### Marco 0 — requisitos e risco

Fechar público inicial e modalidades de contratação; verificar matriz normativa REP-P/PTRP; definir categorias documentais e dados; desenhar telas do funcionário/RH/gestor. Saída: contratos de domínio e critérios de aceite, incluindo riscos sem solução.

### Marco 1 — fundação e primeiro fluxo

Identidade, organizações, permissões, pessoa/vínculo, auditoria, arquivos privados e portal básico. Entregar convite de admissão, coleta documental e conferência pelo RH. IA começa com proposta de extração administrativa. Testar isolamento com dois tenants e múltiplos CNPJs.

### Marco 2 — ponto e portal integrados

Implementar registrador conforme matriz validada, comprovantes e consulta pessoal. Adicionar jornadas, tratamento, ajustes, filas do gestor e espelho. Testes incluem turnos noturnos, virada de dia, versões de regra, repetição de requisição, falha de rede e acesso indevido. Piloto controlado em paralelo ao sistema atual; operação oficial somente com requisitos e evidências verificados.

### Marco 3 — operação do RH

Publicação conferida de holerites, mensagens, solicitações, férias/afastamentos administrativos, notificações e fila operacional. Assistente com fontes aprovadas e resumos. Nenhum documento salarial é publicado em caso de associação ambígua.

### Marco 4 — expansão

Assinaturas, novos adaptadores de folha e integrações. Só então detalhar ativação opcional do Thirdia para TST/SST. Não compartilhar automaticamente a base nem transformar configuração de RH em requisito de obra.

## 11. Critérios de sucesso

Medir redução do tempo gasto por admissão, taxa de conclusão por autoatendimento, pedidos repetidos ao RH, tempo de resolução de solicitações, trabalho no fechamento do ponto, erros de associação de documentos e retrabalho provocado pela IA.

Não usar apenas quantidade de respostas do assistente como métrica. Avaliar acerto de campos extraídos, capacidade de abstenção, referências corretas, tentativas de acesso entre empresas, execução duplicada e respeito às confirmações.

## 12. Próxima decisão de implementação

Este documento não cria repositório, infraestrutura, contas ou contratação de fornecedores. A implementação deve ocorrer em projeto próprio, separado do checkout gd5. Repositório definido: https://github.com/dudaedific-lab/ELOZIA.git. Antes de abrir a implementação de ponto, concluir a verificação normativa; o trabalho de fundação e prototipação pode avançar independentemente.

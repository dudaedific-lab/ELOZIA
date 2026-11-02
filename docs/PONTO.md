# Ponto eletrônico — fronteira da primeira entrega

O usuário definiu ponto próprio com atendimento à regulamentação aplicável. Modalidade-alvo a avaliar: REP-P + tratamento PTRP. Este documento não substitui consulta ao texto oficial vigente e aos responsáveis técnicos/jurídicos.

## Implementado e testado

- Recepção de marcações com horário do servidor.
- Identificação pelo vínculo da sessão, nunca pelo employee_id enviado pelo navegador.
- Número sequencial por empresa, hash de integridade encadeado e idempotência por vínculo.
- Bloqueio de UPDATE/DELETE dos originais por gatilhos no SQLite e PostgreSQL.
- Solicitação de inclusão, decisão por outra pessoa e inclusão separada do original.
- Consulta e soma de intervalos fechados. O dia corrente pode estar incompleto; não há inferência de intervalos faltantes.
- JSON de teste com número, hash, horário e aviso explícito de ausência de valor de comprovante oficial.
- A chamada ao provedor de IA acontece fora da fila do banco, sem impedir a recepção de marcações.

## Ainda obrigatório antes de operação oficial

Construir matriz a partir das fontes oficiais atuais: requisito, dispositivo normativo, modalidade, componente, evidência, responsável e teste. Verificar especialmente:

- Enquadramento REP-P/PTRP, documentos técnicos e exigências de registro do programa.
- Identificação do empregador e trabalhador, sequência e campos obrigatórios.
- Fonte de tempo, sincronização, fuso, desvios e contingências.
- Formato, entrega, disponibilidade e assinatura do comprovante.
- Leiautes e assinaturas de AFD, AEJ e espelhos.
- Tratamento de omissões, desconsiderações, motivos, autorizações e histórico.
- Jornada noturna, viradas de dia, escalas, tolerâncias, intervalos, feriados e regras coletivas versionadas.
- Horas extras, banco de horas, fechamento, retificação e integração com folha.
- Disponibilidade, retenção, rastreabilidade e recuperação.

Não usar a IA para inventar uma marcação, decidir direitos ou alterar regras a partir de uma CCT sem validação responsável. O registro de teste atual não impõe ordem ou horário de escala às marcações e não substitui um ponto oficial. A marcação original é independente da aprovação de ajustes.

import { id, now, hashPassword, dayOf } from "./domain.mjs";
export async function seed(db) {
  if (
    db.url ||
    process.env.NODE_ENV === "production" ||
    process.env.DEMO_SEED === "false"
  )
    return;
  if ((await db.query("SELECT id FROM companies LIMIT 1")).length) return;
  await db.transaction(async () => {
    const company = id(),
      at = now();
    await db.execute(
      "INSERT INTO companies(id,name,legal_name,tax_id,created_at) VALUES(?,?,?,?,?)",
      [
        company,
        "Estúdio Aurora",
        "Aurora Serviços e Tecnologia — demonstração",
        "",
        at,
      ],
    );
    const staff = [
      [
        "Marina Costa",
        "marina@exemplo.test",
        "Diretora de pessoas",
        "Pessoas & Cultura",
        "São Paulo",
        "admin",
      ],
      [
        "Lucas Almeida",
        "lucas@exemplo.test",
        "Coordenador de operações",
        "Operações",
        "São Paulo",
        "manager",
      ],
      [
        "Beatriz Santos",
        "beatriz@exemplo.test",
        "Analista de projetos",
        "Operações",
        "São Paulo",
        "employee",
      ],
      [
        "Rafael Oliveira",
        "rafael@exemplo.test",
        "Designer de produto",
        "Produto",
        "Remoto",
        null,
      ],
      [
        "Camila Ferreira",
        "camila@exemplo.test",
        "Analista financeira",
        "Financeiro",
        "São Paulo",
        null,
      ],
      [
        "Pedro Martins",
        "pedro@exemplo.test",
        "Desenvolvedor",
        "Tecnologia",
        "Remoto",
        null,
      ],
      [
        "Ana Ribeiro",
        "ana@exemplo.test",
        "Assistente de operações",
        "Operações",
        "São Paulo",
        null,
      ],
    ];
    const colors = ["#e0eee5", "#eee4d8", "#e2e8f5", "#f3e1e7"];
    let employeeUser;
    for (let i = 0; i < staff.length; i++) {
      const [name, email, job, department, unit, role] = staff[i],
        employee = id();
      await db.execute(
        "INSERT INTO employees(id,company_id,name,email,job_title,department,unit,status,admission_date,avatar_color,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
        [
          employee,
          company,
          name,
          email,
          job,
          department,
          unit,
          i === 6 ? "onboarding" : "active",
          "2026-02-02",
          colors[i % 4],
          at,
        ],
      );
      if (role) {
        const user = id();
        await db.execute(
          "INSERT INTO users(id,company_id,employee_id,name,email,password_hash,role,created_at) VALUES(?,?,?,?,?,?,?,?)",
          [
            user,
            company,
            employee,
            name,
            email,
            hashPassword("Elozia@2026"),
            role,
            at,
          ],
        );
        if (role === "employee") employeeUser = { id: user, employee };
      }
    }
    const admin = (await db.query("SELECT id FROM users WHERE role='admin'"))[0]
      .id;
    await db.execute(
      "INSERT INTO messages(id,company_id,sender_id,employee_id,title,body,created_at) VALUES(?,?,?,?,?,?,?)",
      [
        id(),
        company,
        admin,
        null,
        "Um novo jeito de cuidar da nossa rotina",
        "Bem-vindos à Elozia! Por aqui você acompanha seu ponto, envia solicitações e encontra seus documentos. Este ambiente contém apenas dados fictícios para explorar o produto.",
        at,
      ],
    );
    for (const [kind, title, description, start, end] of [
      [
        "vacation",
        "Férias de dezembro",
        "Gostaria de solicitar 10 dias de férias para o fim do ano.",
        "2026-12-07",
        "2026-12-16",
      ],
      [
        "adjustment",
        "Esquecimento de saída",
        "Esqueci de registrar a saída. Solicito análise do horário de 17h.",
        "2026-10-30",
        "2026-10-30",
      ],
    ])
      await db.execute(
        "INSERT INTO requests(id,company_id,employee_id,kind,title,description,start_date,end_date,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [
          id(),
          company,
          employeeUser.employee,
          kind,
          title,
          description,
          start,
          end,
          "pending",
          at,
        ],
      );
    for (const [name, email, job, stage] of [
      [
        "Isabela Rocha",
        "isabela@exemplo.test",
        "Analista de atendimento",
        "invited",
      ],
      [
        "Gabriel Lima",
        "gabriel@exemplo.test",
        "Desenvolvedor front-end",
        "collecting",
      ],
      [
        "Juliana Alves",
        "juliana@exemplo.test",
        "Analista de operações",
        "review",
      ],
    ])
      await db.execute(
        "INSERT INTO admissions(id,company_id,name,email,job_title,department,start_date,stage,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
        [id(), company, name, email, job, "Operações", dayOf(), stage, at],
      );
  });
}

import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Store, root } from "../server/db.mjs";
import { seed } from "../server/seed.mjs";
import { createApp } from "../server/app.mjs";
const dir = await mkdtemp(path.join(os.tmpdir(), "elozia-browser-"));
const db = await new Store({ file: path.join(dir, "app.sqlite") }).open();
await db.prepare();
await seed(db);
const server = createApp(db, { files: path.join(dir, "files") });
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port;
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.error("BROWSER_ERROR", e.stack);
});
let checks = 0;
async function check(label, fn) {
  await fn();
  checks++;
  console.log("OK", label);
}
async function nav(label) {
  await page
    .locator("nav")
    .getByRole("button", { name: label, exact: true })
    .click();
  await page.waitForFunction(() => !document.querySelector(".sidebar.open"));
}
async function logout() {
  await page.locator(".profile").click();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await page.getByRole("heading", { name: "Bom ter você aqui." }).waitFor();
}
try {
  await page.goto(base);
  await check("login e navegação do RH", async () => {
    await page.getByRole("button", { name: "RH", exact: true }).click();
    await page.getByRole("heading", { name: /Olá, Marina/ }).waitFor();
    assert.equal(await page.locator(".stat-card").count(), 4);
  });
  await check("cadastro de funcionário com acesso ao portal", async () => {
    await page
      .getByRole("button", { name: "Novo funcionário", exact: true })
      .click();
    const form = page.getByRole("dialog");
    await form.locator("[name=name]").fill("Joana Teste");
    await form.locator("[name=email]").fill("joana@example.test");
    await form.locator("[name=job_title]").fill("Analista");
    await form.locator("[name=department]").fill("Operações");
    await form.locator("[name=create_access]").check();
    await form.locator("[name=password]").fill("Portal-Joana-2026");
    await form
      .getByRole("button", { name: "Cadastrar funcionário", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Funcionário cadastrado." })
      .waitFor();
    await nav("Pessoas");
    await page
      .getByRole("textbox", { name: "Buscar funcionário" })
      .fill("Joana");
    await page
      .locator("tbody")
      .getByText("Joana Teste", { exact: true })
      .waitFor();
  });
  await check(
    "holerite privado enviado e publicado após conferência",
    async () => {
      await nav("Holerites");
      await page.getByRole("button", { name: "Importar holerite" }).click();
      const form = page.getByRole("dialog");
      await form
        .locator("[name=employee_id]")
        .selectOption({ label: "Joana Teste" });
      await form.locator("[name=title]").fill("Holerite outubro de Joana");
      await form.locator("[name=competence]").fill("2026-10");
      await form
        .locator("input[type=file]")
        .setInputFiles({
          name: "holerite-teste.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Demonstrativo fictício de teste."),
        });
      await form
        .getByRole("button", { name: "Enviar para conferência" })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Arquivo recebido" })
        .waitFor();
      await page.getByRole("button", { name: "Conferir e publicar" }).click();
      await page.getByRole("dialog").getByRole("checkbox").check();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Conferir e publicar", exact: true })
        .click();
      await page.getByText("Publicado", { exact: true }).waitFor();
    },
  );
  await check(
    "assistente identifica modo sem IA e responde com contexto",
    async () => {
      await page
        .getByRole("button", { name: "Abrir assistente Elozia", exact: true })
        .click();
      await page
        .getByText("Resumo operacional · sem IA conectada", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "O que precisa da minha atenção?" })
        .click();
      await page
        .getByText("Calculado pelas regras do ambiente", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Fechar assistente", exact: true })
        .last()
        .click();
    },
  );
  await check("todas as telas administrativas abrem sem erro", async () => {
    for (const label of [
      "Admissões",
      "Jornada e ponto",
      "Solicitações",
      "Documentos",
      "Comunicação",
      "Histórico",
      "Configurações",
      "Visão geral",
    ])
      await nav(label);
  });
  await mkdir(path.join(root, "test-results"), { recursive: true });
  if (
    await page
      .getByRole("button", { name: "Fechar aviso", exact: true })
      .count()
  )
    await page
      .getByRole("button", { name: "Fechar aviso", exact: true })
      .click();
  await page.screenshot({
    path: path.join(root, "test-results", "elozia-desktop.png"),
    fullPage: true,
    animations: "disabled",
  });
  await check("layout móvel e menu", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await page.getByRole("button", { name: "Abrir menu" }).click();
    await nav("Solicitações");
    await page
      .getByRole("heading", { name: "Solicitações", exact: true })
      .waitFor();
    await page.screenshot({
      path: path.join(root, "test-results", "elozia-mobile.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.setViewportSize({ width: 1440, height: 1050 });
  });
  await check(
    "portal do funcionário exibe somente seus documentos e cadastro",
    async () => {
      await logout();
      await page.locator("[name=email]").fill("joana@example.test");
      await page.locator("[name=password]").fill("Portal-Joana-2026");
      await page.getByRole("button", { name: "Entrar na minha conta" }).click();
      await page.getByRole("heading", { name: /Olá, Joana/ }).waitFor();
      await nav("Meu cadastro");
      assert.equal(await page.locator("tbody tr").count(), 1);
      await nav("Holerites");
      await page
        .getByText("Holerite outubro de Joana", { exact: true })
        .waitFor();
      assert.equal(
        await page.getByRole("button", { name: "Importar holerite" }).count(),
        0,
      );
    },
  );
  await check("marcação gera registro e comprovante de teste", async () => {
    await nav("Meu ponto");
    await page
      .getByRole("button", { name: "Registrar teste", exact: true })
      .click();
    await page.getByText(/Registro #1 recebido/).waitFor();
    await page
      .getByRole("button", { name: "Baixar registro de teste" })
      .waitFor();
    assert((await page.getByText("08:00", { exact: true }).count()) === 0);
  });
  await check(
    "pedido do funcionário chega ao RH e pode ser decidido",
    async () => {
      await nav("Solicitações");
      await page.getByRole("button", { name: "Nova solicitação" }).click();
      const form = page.getByRole("dialog");
      await form.locator("[name=kind]").selectOption("other");
      await form.locator("[name=title]").fill("Pedido E2E de orientação");
      await form
        .locator("[name=description]")
        .fill("Preciso de orientação sobre o portal.");
      await form.getByRole("button", { name: "Enviar solicitação" }).click();
      await page
        .getByText("Pedido E2E de orientação", { exact: true })
        .waitFor();
      await logout();
      await page.getByRole("button", { name: "RH", exact: true }).click();
      await page.getByRole("heading", { name: /Olá, Marina/ }).waitFor();
      await nav("Solicitações");
      await page
        .getByRole("button", { name: "Pedido E2E de orientação", exact: true })
        .click();
      await page
        .getByRole("dialog")
        .locator("[name=note]")
        .fill("Orientação enviada pelo RH.");
      await page
        .getByRole("button", { name: "Registrar decisão", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Decisão registrada" })
        .waitFor();
      await page.getByRole("button", { name: /Aprovadas/ }).click();
      await page
        .getByText("Pedido E2E de orientação", { exact: true })
        .waitFor();
    },
  );
  assert.deepEqual(errors, []);
  console.log(`Resultado: ${checks} fluxos aprovados; zero erros JavaScript.`);
} catch (e) {
  await mkdir(path.join(root, "test-results"), { recursive: true });
  await page.screenshot({
    path: path.join(root, "test-results", "failure.png"),
    fullPage: true,
  });
  throw e;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await db.close();
  await rm(dir, { recursive: true, force: true });
}

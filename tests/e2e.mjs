/**
 * Testes de fluxo no navegador (Playwright). Rodar com o servidor de produção no ar:
 *   npm run build && npx next start -p 3200
 *   node tests/e2e.mjs            (usa PLAYWRIGHT_PATH ou o playwright instalado globalmente)
 * O relógio do navegador é fixado para testar loja aberta e fechada no horário de Brasília.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? "playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3200/";

let failures = 0;
const results = [];
function check(name, ok, detail = "") {
  results.push(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures++;
}

async function open(browser, { width, height, time }) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date(time));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  return { context, page };
}

const ticket = (page) => page.locator("aside[aria-label='Comanda']");
const text = async (loc) => (await loc.innerText()).replace(/\s+/g, " ");

const browser = await chromium.launch();

/* ---------------- Desktop, quinta 19:42 (aberto) ---------------- */
{
  const { context, page } = await open(browser, { width: 1440, height: 900, time: "2026-10-22T19:42:00-03:00" });
  check("sem rolagem horizontal em 1440", (await page.evaluate(() => document.documentElement.scrollWidth)) <= 1440);
  check("status aberto no herói", (await text(page.locator("#topo"))).includes("Aberto até 00:30"));

  // Diálogo do Crosta: obrigatório sem pré-seleção
  const opener = page.getByRole("button", { name: /Escolher o ponto e pedir o Crosta/ });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  check("diálogo abre com título", (await dialog.getByRole("heading", { level: 2 }).innerText()).toLowerCase().includes("crosta"));
  const checked = await dialog.locator("[role=radio][aria-checked=true]").count();
  check("nenhuma opção pré-selecionada", checked === 0, `${checked} marcadas`);
  await dialog.getByRole("button", { name: /Pôr na comanda/ }).click();
  check("erro do ponto aparece", await dialog.getByText("Escolha: ponto da carne.").isVisible());
  check("foco vai para o grupo obrigatório", await page.evaluate(() => document.activeElement?.getAttribute("role") === "radio"));
  await dialog.getByRole("radio", { name: "Ao ponto" }).click();
  await dialog.getByRole("button", { name: /Picles/ }).first().click();
  await dialog.getByRole("button", { name: "Mais bacon" }).click();
  await dialog.getByRole("button", { name: "Mais quantidade" }).click();
  await dialog.getByLabel(/Observação para a cozinha/).fill("cortar ao meio");
  const btnText = await text(dialog.getByRole("button", { name: /Pôr na comanda/ }));
  check("preço do diálogo = (36 + 6) x 2", btnText.includes("R$ 84,00"), btnText);
  check("autocomplete desligado na observação", (await dialog.getByLabel(/Observação/).getAttribute("autocomplete")) === "off");
  await page.keyboard.press("Escape");
  check("Esc fecha o diálogo", (await page.getByRole("dialog").count()) === 0);
  check("foco volta para quem abriu", await opener.evaluate((el) => el === document.activeElement));

  // Reabre e adiciona de verdade
  await opener.click();
  await dialog.getByRole("radio", { name: "Ao ponto" }).click();
  await dialog.getByRole("button", { name: /Picles/ }).first().click();
  await dialog.getByRole("button", { name: "Mais bacon" }).click();
  await dialog.getByRole("button", { name: "Mais quantidade" }).click();
  await dialog.getByLabel(/Observação para a cozinha/).fill("cortar ao meio");
  await dialog.getByRole("button", { name: /Pôr na comanda/ }).click();
  await page.waitForTimeout(600);
  let t = await text(ticket(page));
  check("comanda imprime 2x Crosta R$ 84,00", t.includes("2x Crosta") && t.includes("R$ 84,00"), t.slice(0, 160));
  check("modificadores impressos", t.includes("sem picles") && t.includes("+ 1x bacon") && t.includes("obs.: cortar ao meio") && t.includes("ponto da carne: ao ponto"));

  // Adição direta: batata grande e lata
  await page.getByRole("button", { name: /Batata da Chapa: Grande/ }).click();
  await page.getByRole("button", { name: /Refrigerante lata: Cola$/ }).click();
  await page.waitForTimeout(400);
  t = await text(ticket(page));
  check("batata e lata na comanda, agrupadas por estação", t.includes("FRITADEIRA") && t.includes("BALCÃO") && t.includes("Batata da Chapa"), t.slice(0, 80));
  check("total de itens 84 + 19 + 7 = 110", t.includes("Itens (4) R$ 110,00"), t.match(/Itens \(\d+\) R\$ [\d.,]+/)?.[0]);
  check("item indisponível não tem botão", (await page.getByRole("button", { name: /Limonada/ }).count()) === 0);

  // Cupom inválido e válido
  const cupom = ticket(page).getByLabel("Cupom");
  check("cupom sem autocomplete", (await cupom.getAttribute("autocomplete")) === "off");
  await cupom.fill("xyz");
  await ticket(page).getByRole("button", { name: "Aplicar" }).click();
  check("cupom inválido avisa", (await text(ticket(page))).includes("Cupom não encontrado"));
  await ticket(page).getByRole("button", { name: "remover" }).click();
  await ticket(page).getByLabel("Cupom").fill("balcao10");
  await ticket(page).getByRole("button", { name: "Aplicar" }).click();
  t = await text(ticket(page));
  check("cupom BALCAO10 aplica 10% = R$ 11,00", t.includes("Cupom BALCAO10 −R$ 11,00"), t.match(/Cupom BALCAO10[^R]*R\$ [\d,]+/)?.[0]);

  // Persistência
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  t = await text(ticket(page));
  check("comanda e cupom sobrevivem ao recarregar", t.includes("2x Crosta") && t.includes("Cupom BALCAO10"));

  // Editar a linha
  await ticket(page).getByRole("button", { name: "Editar Crosta" }).click();
  const edit = page.getByRole("dialog");
  check("edição traz o ponto escolhido", (await edit.getByRole("radio", { name: "Ao ponto" }).getAttribute("aria-checked")) === "true");
  await edit.getByRole("button", { name: "Menos quantidade" }).click();
  await edit.getByRole("button", { name: /Atualizar a linha/ }).click();
  await page.waitForTimeout(500);
  t = await text(ticket(page));
  check("edição atualiza para 1x R$ 42,00", t.includes("1x Crosta") && t.includes("R$ 42,00"));

  // Checkout com erros
  await ticket(page).getByRole("button", { name: /Fechar pedido/ }).click();
  await ticket(page).getByRole("button", { name: /Gerar mensagem do pedido|Enviar pelo WhatsApp/ }).click();
  t = await text(ticket(page));
  check("checkout vazio lista o que falta", /Faltam \d informações/.test(t), t.match(/Faltam \d informações/)?.[0]);
  await ticket(page).getByRole("radio", { name: /Entrega/ }).click();
  await ticket(page).getByRole("button", { name: /Escolha o bairro/ }).click();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  t = await text(ticket(page));
  check("bairro por teclado: Vila Nova R$ 7,00", t.includes("Vila Nova") && t.includes("Entrega R$ 7,00"));
  const rua = ticket(page).getByLabel("Rua");
  check("rua sem autocomplete e sem nome reconhecível", (await rua.getAttribute("autocomplete")) === "off" && (await rua.getAttribute("name")) === "crosta-via");
  await rua.fill("Rua das Acácias");
  await ticket(page).getByLabel("Número").fill("120");
  await ticket(page).getByRole("radio", { name: /Assim que possível/ }).click();
  await ticket(page).getByRole("radio", { name: /Dinheiro/ }).click();
  await ticket(page).getByLabel("Troco para quanto?").fill("50");
  await ticket(page).getByLabel("Como chamamos você?").fill("Ana");
  await ticket(page).getByRole("button", { name: /Gerar mensagem do pedido|Enviar pelo WhatsApp/ }).click();
  t = await text(ticket(page));
  check("troco menor que o total é recusado", t.includes("O valor precisa cobrir o total"));
  await ticket(page).getByLabel("Troco para quanto?").fill("100");
  await ticket(page).getByRole("button", { name: /Gerar mensagem do pedido|Enviar pelo WhatsApp/ }).click();
  await page.waitForTimeout(300);
  const msg = await ticket(page).locator("pre").innerText();
  // itens 42 + 19 + 7 = 68 → cupom bloqueado (mínimo 70); entrega 7 → total 75
  check("mensagem: itens e modificadores", msg.includes("1x Crosta — R$ 42,00") && msg.includes("   sem picles"));
  check("mensagem: cupom fora (itens abaixo de R$ 70)", !msg.includes("Cupom"), msg.match(/Itens: .*/)?.[0]);
  check("mensagem: entrega, total, troco", msg.includes("Entrega (Vila Nova): R$ 7,00") && msg.includes("*Total: R$ 75,00*") && msg.includes("troco para R$ 100,00 (devolver R$ 25,00)"));
  check("mensagem: endereço e quando", msg.includes("Rua das Acácias, 120") && msg.includes("assim que possível (estimativa de 30 a 45 min)"));
  check("mensagem sem emoji", !/\p{Extended_Pictographic}/u.test(msg));
  await context.close();
}

/* ---------------- Desktop, segunda 20:00 (fechado) ---------------- */
{
  const { context, page } = await open(browser, { width: 1440, height: 900, time: "2026-10-26T20:00:00-03:00" });
  check("status fechado com próxima abertura", (await text(page.locator("#topo"))).includes("Fechado. Abre amanhã às 18:00"));
  await page.getByRole("button", { name: "Pôr a Dupla na comanda" }).click();
  const dialog = page.getByRole("dialog");
  check("Dupla mostra preço de campanha (próximo serviço é terça)", (await text(dialog)).includes("Preço de campanha aplicado"));
  await dialog.getByRole("radio", { name: "Bem passado" }).click();
  await dialog.getByRole("button", { name: "Mais quantidade" }).click();
  check("limite de 2 Duplas por pedido", await dialog.getByRole("button", { name: "Mais quantidade" }).isDisabled());
  await dialog.getByRole("button", { name: /Pôr na comanda/ }).click();
  await page.waitForTimeout(500);
  let t = await text(ticket(page));
  check("2x Dupla a R$ 98,00 com preço de lista riscado", t.includes("2x Dupla da Chapa") && t.includes("R$ 98,00") && t.includes("preço de campanha"));
  await ticket(page).getByRole("button", { name: /Fechar pedido/ }).click();
  await ticket(page).getByRole("radio", { name: /Retirada no balcão/ }).click();
  const agora = ticket(page).getByRole("radio", { name: /Assim que possível/ });
  check("'assim que possível' indisponível com a loja fechada", (await agora.getAttribute("aria-disabled")) === "true");
  await ticket(page).getByRole("radio", { name: /Agendar um horário/ }).click();
  const days = await ticket(page).getByRole("group", { name: "Dia" }).innerText();
  check("agenda começa amanhã (terça), sem segunda", days.trim().startsWith("amanhã") && !days.includes("seg"), days.replace(/\s+/g, " "));
  await ticket(page).getByRole("radio", { name: "18:30" }).click();
  await ticket(page).getByRole("radio", { name: /^Pix/ }).click();
  await ticket(page).getByLabel("Como chamamos você?").fill("Rui");
  await ticket(page).getByRole("button", { name: /Gerar mensagem do pedido|Enviar pelo WhatsApp/ }).click();
  await page.waitForTimeout(300);
  const msg = await ticket(page).locator("pre").innerText();
  check("mensagem: retirada agendada para terça 18:30", msg.includes("retirar às 18:30 de amanhã (terça, 27/10)"), msg.match(/\*Quando:\*.*/)?.[0]);
  check("mensagem: aviso de confirmação do horário", msg.includes("aguardo a confirmação"));
  check("mensagem: total da Dupla na campanha", msg.includes("*Total: R$ 98,00*"));
  await context.close();
}

/* ---------------- Celular 390 e 320 ---------------- */
for (const width of [390, 320]) {
  const { context, page } = await open(browser, { width, height: 844, time: "2026-10-22T19:42:00-03:00" });
  check(`sem rolagem horizontal em ${width}`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
  const bar = page.getByRole("button", { name: /comanda/i }).filter({ hasText: /vazia|item/ });
  check(`barra da comanda visível em ${width}`, await bar.isVisible());
  // Monte seu smash
  const monte = page.locator("#monte");
  await monte.scrollIntoViewIfNeeded();
  await monte.getByRole("button", { name: /Pôr na comanda/ }).last().click();
  check(`builder pede pão e ponto em ${width}`, (await text(monte)).includes("Escolha o pão."));
  await monte.getByRole("radio", { name: /Pão de batata/ }).click();
  await monte.getByRole("radio", { name: "Bem passado" }).click();
  await monte.getByRole("button", { name: "Mais carne smash 90 g" }).click();
  await monte.getByRole("button", { name: "Mais cheddar" }).click();
  await monte.getByRole("button", { name: "Mais molho da casa" }).click();
  await monte.getByRole("button", { name: "Mais mostarda" }).click();
  check(`limite de 2 molhos em ${width}`, await monte.getByRole("button", { name: "Mais ketchup" }).isDisabled());
  const strip = await text(monte.locator(".sticky").first());
  check(`faixa mostra preço 18 + 9 + 4 + 3 = 34 em ${width}`, strip.includes("R$ 34,00"), strip);
  const add = monte.getByRole("button", { name: /Pôr na comanda/ }).last();
  await add.scrollIntoViewIfNeeded();
  // a barra fixa não pode cobrir o botão
  const covered = await add.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !el.contains(hit);
  });
  check(`botão não fica sob a barra fixa em ${width}`, !covered);
  await add.click();
  await page.waitForTimeout(500);
  check(`barra atualiza para 1 item em ${width}`, (await text(bar)).includes("1 item") && (await text(bar)).includes("R$ 34,00"));
  await bar.click();
  const sheet = page.getByRole("dialog");
  await sheet.waitFor();
  check(`folha da comanda abre em ${width}`, (await text(sheet)).includes("Do seu jeito"));
  check(`folha sem rolagem horizontal em ${width}`, (await page.evaluate(() => document.documentElement.scrollWidth)) <= width);
  // Editar de dentro da folha: dois diálogos empilhados, o Esc fecha só o de cima.
  await sheet.getByRole("button", { name: "Editar Do seu jeito" }).click();
  check(`edição abre por cima da folha em ${width}`, (await page.getByRole("dialog").count()) === 2);
  await page.keyboard.press("Escape");
  check(`Esc fecha só a edição em ${width}`, (await page.getByRole("dialog").count()) === 1);
  check(`página segue travada com a folha aberta em ${width}`, (await page.evaluate(() => document.documentElement.style.overflow)) === "hidden");
  await page.keyboard.press("Escape");
  check(`Esc fecha a folha em ${width}`, (await page.getByRole("dialog").count()) === 0);
  check(`rolagem volta ao fechar em ${width}`, (await page.evaluate(() => document.documentElement.style.overflow)) === "");
  await context.close();
}

/* ---------------- Movimento reduzido ---------------- */
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  const dur = await page.evaluate(() => {
    const el = document.createElement("div");
    el.className = "printing";
    document.body.appendChild(el);
    return getComputedStyle(el).animationDuration;
  });
  check("movimento reduzido encurta animações", dur === "0.001s" || dur === "1e-06s" || dur === "0.001s", dur);
  await context.close();
}

await browser.close();
console.log(results.join("\n"));
console.log(`\n${results.length - failures}/${results.length} verificações passaram`);
process.exit(failures ? 1 : 0);

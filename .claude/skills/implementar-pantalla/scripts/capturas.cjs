// Capturas de pantallas de ColaboraCar con la API simulada (MSW), para compararlas con los frames.
//
// Uso (desde un directorio del scratchpad con playwright-core instalado):
//   npm i playwright-core@1.40.0
//   node capturas.cjs --email carlos.mendoza@utp.edu.pe --out ./capturas \
//     --rutas /dashboard,/viajes/publicar [--url http://localhost:5199] [--chrome <ruta>]
//
// Requiere el frontend corriendo con mocks: VITE_USE_MOCKS=true npx vite --port 5199 --strictPort
// Guarda una captura de página completa por ruta (390 × 844 a 2×) e imprime los errores de la página.
const path = require("path");
const fs = require("fs");
const { chromium } = require(require.resolve("playwright-core", { paths: [process.cwd()] }));

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pares, arg, i, lista) => {
    if (arg.startsWith("--")) pares.push([arg.slice(2), lista[i + 1]]);
    return pares;
  }, []),
);
const url = args.url ?? "http://localhost:5199";
const email = args.email ?? "valeria.rodriguez@utp.edu.pe";
const out = path.resolve(args.out ?? "capturas");
const rutas = (args.rutas ?? "/dashboard").split(",");
const chrome = args.chrome ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: chrome });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on("pageerror", (error) => console.log("ERROR DE PÁGINA:", error.message));

  // Login con la contraseña demo y el OTP fijo de los mocks.
  await page.goto(`${url}/auth/login`);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.locator('input[type="password"]').fill("Clave#2026");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/verificacion|dashboard|completar-perfil/, { timeout: 10000 });
  if (page.url().includes("verificacion")) {
    for (let i = 1; i <= 6; i++) await page.getByLabel(`Dígito ${i} del código`).fill(String(i));
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard|completar-perfil/, { timeout: 10000 });
  }

  for (const ruta of rutas) {
    await page.goto(`${url}${ruta}`);
    await page.waitForTimeout(1500);
    const archivo = path.join(out, `${ruta.replace(/\W+/g, "_").replace(/^_|_$/g, "") || "inicio"}.png`);
    await page.screenshot({ path: archivo, fullPage: true });
    console.log("captura:", archivo);
  }
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

const url = process.env.DATABASE_URL?.trim();

if (!url) {
  console.error(`
============================================================
DATABASE_URL está vazia ou não foi configurada na Vercel.

1. Abra o projeto na Vercel → Settings → Environment Variables
2. Adicione:
   DATABASE_URL = connection string do Neon (pooled, sslmode=require)
   AUTH_SECRET  = openssl rand -base64 32
   AUTH_URL     = https://SEU-APP.vercel.app
3. Marque Production (e Preview, se quiser)
4. Redeploy

Neon: https://console.neon.tech → Connection string
============================================================
`);
  process.exit(1);
}

console.log("DATABASE_URL detectada. Seguindo com migrate + build…");

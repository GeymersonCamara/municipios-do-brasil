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
3. (Opcional, recomendado) DIRECT_URL = connection string direta do Neon
   (sem "-pooler" no host). O build deriva automaticamente se faltar.
4. Marque Production (e Preview, se quiser)
5. Redeploy

Neon: https://console.neon.tech → Connection string
============================================================
`);
  process.exit(1);
}

if (url.includes("-pooler.")) {
  console.log(
    "DATABASE_URL usa host pooler do Neon. Migrate usará conexão direta (sem pooler).",
  );
}

console.log("DATABASE_URL detectada. Seguindo com migrate + build…");

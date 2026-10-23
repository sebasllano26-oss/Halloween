# Certificado público de Supabase

`supabase-root-2021.crt` es la autoridad pública usada para verificar las conexiones PostgreSQL de Supabase. No contiene claves privadas.

Descargado el 23 de octubre de 2026 desde la [URL oficial de Supabase](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt), definida en el [código del panel de Supabase](https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json).

Huella SHA-256: `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`. Vence el 26 de abril de 2031.

El servidor proporciona esta CA a `pg` y conserva la verificación del certificado y del nombre del servidor. No requiere una variable adicional en Vercel. Referencias: [SSL en Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement) y [SSL en node-postgres](https://node-postgres.com/features/ssl).

# Arena de Pruebas · competencia sincronizada

Juego por equipos para la Sesión 6 de *Diseños de investigación I* (Corte III). Los equipos entran desde el celular con un código de 4 letras, avanzan a su ritmo por seis mundos con más de 60 retos gráficos (señal y ruido, tamaño del efecto, tamaño de muestra, qué prueba toca, leer resultados, escribir y supuestos), en orden distinto para cada equipo y el marcador se mueve en vivo en el proyector. Nadie se registra: solo código + nombre de equipo.

- `/` → celular de los equipos
- `/profe` → proyector del docente (crea la arena, abre, +5 min, termina, reinicia)
- `/api/*` → funciones serverless (Node, sin dependencias)
- `public/shared/challenges.js` → los retos; `grade()` califica en el servidor (el celular nunca recibe las respuestas)

## Desplegar en Vercel con Supabase (15 minutos)

1. Suba la carpeta a GitHub e impórtela en Vercel (**Add New → Project → Import**; framework *Other*, sin build).
2. En [supabase.com](https://supabase.com) cree un proyecto (plan gratuito). En **SQL Editor → New query** pegue el contenido de `supabase.sql` y pulse **Run**: crea las dos tablas (`arena_kv`, `arena_hash`).
3. En Supabase, **Project Settings → API**: copie la **Project URL** y la **service_role key** (la secreta, no la anon).
4. En Vercel, **Settings → Environment Variables** del proyecto, agregue:
   - `SUPABASE_URL` = la Project URL (https://xxxx.supabase.co)
   - `SUPABASE_SERVICE_ROLE_KEY` = la service_role key
   Marque Production, Preview y Development → Save.
5. **Deployments → ⋯ → Redeploy**. Las funciones leen las variables solo en el despliegue siguiente.
6. Abra `https://SU-PROYECTO.vercel.app/profe`, pulse **Crear arena**: el chip debe decir **en línea · supabase**.

La service_role key solo vive en las funciones del servidor (`/api`); nunca llega al navegador. También se admite Upstash Redis (variables `KV_REST_API_URL` / `KV_REST_API_TOKEN`, creadas por Vercel → Storage). Sin ninguna de las dos la arena funciona en memoria, que sirve para probar en un solo computador pero no para la clase.

## Probar en el computador

```
node dev-server.js        # http://localhost:3000  (celular) · http://localhost:3000/profe (proyector)
```

## Reglas del juego (están en las pantallas)

- Seis mundos en orden fijo; dentro de cada mundo, los retos van barajados para cada equipo (semilla por equipo, calculada en el servidor).
- Cada reto abre con "Primero, lo básico" (lección breve), termina con el porqué, y el glosario "Recuerda los conceptos" está siempre arriba. Al entrar a un mundo aparece su introducción.
- Tipos de reto: opción múltiple (100 / 50 en segundo intento), selección múltiple, verdadero/falso en ráfaga (25 por acierto), ordenar (100 exacto, 20 por posición), emparejar (25 por pareja), deslizadores de d, r y n (puntos por cercanía), elegir la nube más correlacionada, y la máquina de réplicas (16 de 20 con la menor gente; −10 por intento fallido).
- Racha: tres retos perfectos seguidos dan +25 por cada uno adicional.
- Ranking: puntos; empate lo gana quien terminó antes.

## Cambiar los retos

Edite `public/shared/challenges.js`. Los retos con datos (`signal`, `dslider`, `nslider`, `replicas`) se generan con una semilla fija, así que todos ven lo mismo y el servidor puede recalcular la respuesta. Para los de opción múltiple (`mcq`, `multi`) la respuesta va en `answer` y nunca sale al cliente (`publicList()` la quita).

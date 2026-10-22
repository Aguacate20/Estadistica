# Arena de Pruebas · competencia sincronizada

Juego por equipos para la Sesión 6 de *Diseños de investigación I* (Corte III). Los equipos entran desde el celular con un código de 4 letras, avanzan a su ritmo por 15 retos gráficos (señal y ruido, tamaño del efecto, tamaño de muestra, qué prueba toca, leer resultados, supuestos, escribir en APA) y el marcador se mueve en vivo en el proyector. Nadie se registra: solo código + nombre de equipo.

- `/` → celular de los equipos
- `/profe` → proyector del docente (crea la arena, abre, +5 min, termina, reinicia)
- `/api/*` → funciones serverless (Node, sin dependencias)
- `public/shared/challenges.js` → los retos; `grade()` califica en el servidor (el celular nunca recibe las respuestas)

## Desplegar en Vercel (10 minutos)

1. Suba esta carpeta a un repositorio de GitHub (o use `npx vercel` desde la carpeta).
2. En Vercel: **Add New → Project → Import** el repositorio. Framework: *Other*. No hay build.
3. Base de datos (para que todos los celulares vean lo mismo): en el proyecto de Vercel, pestaña **Storage → Create Database → Upstash for Redis** (plan gratuito). Conéctela al proyecto; Vercel crea las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN` (también sirven `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`).
4. **Redeploy** para que las funciones vean las variables.
5. Abra `https://SU-PROYECTO.vercel.app/profe`, cree la arena y proyecte el código. Los equipos entran en `https://SU-PROYECTO.vercel.app`.

Sin base de datos la arena funciona en memoria (sirve para probar en un solo computador, no para la clase: cada función serverless tiene su propia memoria).

## Probar en el computador

```
node dev-server.js        # http://localhost:3000  (celular) · http://localhost:3000/profe (proyector)
```

## Reglas del juego (están en las pantallas)

- Cada reto vale hasta 100 puntos; en los de opción múltiple, el segundo intento vale 50 y el tercero muestra la respuesta.
- Controles deslizantes (d, n): puntos según la cercanía al valor correcto.
- Máquina de réplicas: hay que lograr 16 de 20 réplicas significativas; más puntos con menos personas; −10 por intento fallido.
- Racha: tres retos perfectos seguidos dan +25 por cada uno adicional.
- Ranking: puntos; empate lo gana quien terminó antes.

## Cambiar los retos

Edite `public/shared/challenges.js`. Los retos con datos (`signal`, `dslider`, `nslider`, `replicas`) se generan con una semilla fija, así que todos ven lo mismo y el servidor puede recalcular la respuesta. Para los de opción múltiple (`mcq`, `multi`) la respuesta va en `answer` y nunca sale al cliente (`publicList()` la quita).

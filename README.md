# ⚽ PRODE Mundial 2026

Aplicación de pronósticos para el Mundial 2026. Login con email, base de datos en la nube, tabla de posiciones en tiempo real.

---

## ¿Qué vas a necesitar?

- Una cuenta gratuita en **[supabase.com](https://supabase.com)** (la base de datos)
- Una cuenta gratuita en **[github.com](https://github.com)** (para alojar el código)
- Una cuenta gratuita en **[vercel.com](https://vercel.com)** (para publicar la página)
- El archivo ZIP que te dio Claude con todo el proyecto

---

## PASO 1 · Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) → **Start your project**.
2. Creá una cuenta (podés usar tu email de Google).
3. Hacé clic en **New project**.
4. Poné un nombre (ej: `prode-mundial-2026`), elegí una contraseña fuerte y seleccioná la región **South America (São Paulo)**.
5. Esperá ~2 minutos a que el proyecto se cree.

---

## PASO 2 · Crear las tablas (ejecutar el SQL)

1. En el panel de Supabase, buscá en el menú izquierdo: **SQL Editor**.
2. Hacé clic en **New query**.
3. Abrí el archivo `supabase/schema.sql` del proyecto (podés abrirlo con Notepad o cualquier editor de texto).
4. Seleccioná todo el texto (Ctrl+A), copialo y pegalo en el editor de Supabase.
5. Hacé clic en el botón verde **Run** (o presioná Ctrl+Enter).
6. Deberías ver el mensaje `Success. No rows returned.`

✅ **Verificación**: andá a **Table Editor** en el menú izquierdo. Deberías ver 5 tablas: `profiles`, `predictions`, `results`, `knockout_matches`, `settings`.

---

## PASO 3 · Copiar las claves de Supabase

1. En Supabase, andá a **Project Settings** (ícono de engranaje) → **API**.
2. Copiá estos dos valores (los vas a necesitar más adelante):
   - **Project URL**: empieza con `https://...supabase.co`
   - **anon public key**: una cadena larga que empieza con `eyJ...`

---

## PASO 4 · Subir el código a GitHub

1. Entrá a [github.com](https://github.com) y creá una cuenta si no tenés.
2. Hacé clic en el **+** arriba a la derecha → **New repository**.
3. Nombralo `prode-mundial-2026`, dejalo en **Public** y hacé clic en **Create repository**.
4. En la página del repositorio vacío, buscá el botón **uploading an existing file**.
5. Descomprimí el ZIP del proyecto y arrastrá **todos los archivos y carpetas** al área de GitHub.
6. Hacé clic en **Commit changes**.

✅ **Verificación**: el repositorio debería mostrar las carpetas `src/`, `supabase/` y el archivo `package.json`.

---

## PASO 5 · Desplegar en Vercel

1. Entrá a [vercel.com](https://vercel.com) → **Sign Up** → conectá con tu cuenta de GitHub.
2. Hacé clic en **Add New… → Project**.
3. Buscá el repositorio `prode-mundial-2026` y hacé clic en **Import**.
4. En la sección **Environment Variables** (variables de entorno), agregá dos variables:

   | Nombre | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | tu Project URL (del Paso 3) |
   | `VITE_SUPABASE_ANON_KEY` | tu anon public key (del Paso 3) |

5. Hacé clic en **Deploy** y esperá ~2 minutos.
6. Vercel te va a dar una URL del estilo `https://prode-mundial-2026.vercel.app`.

---

## PASO 6 · Configurar el redirect de autenticación

Este paso es importante para que el login por email funcione correctamente.

1. Copiá la URL de Vercel (ej: `https://prode-mundial-2026.vercel.app`).
2. Volvé a Supabase → **Authentication** → **URL Configuration**.
3. En el campo **Site URL**, pegá tu URL de Vercel.
4. En **Redirect URLs**, hacé clic en **Add URL** y pegá la misma URL.
5. Hacé clic en **Save**.

---

## PASO 7 · ¡Probarlo!

1. Abrí tu URL de Vercel.
2. Ingresá tu email → te va a llegar un email con un botón para confirmar.
3. Hacé clic en el botón del email → elegí tu nombre para el PRODE.
4. ¡Listo! Ya podés cargar pronósticos.

**Para invitar amigos**: mandales el link de Vercel. Cada uno hace el mismo proceso (email → nombre) y ya aparecen en la tabla.

**Para cargar resultados**: andá a la pestaña "Resultados" y creá un PIN. Solo vos (el organizador) necesitás saber ese PIN.

---

## Resolución de problemas comunes

**"Error al conectar con la base de datos"**
→ Revisá que las variables de entorno en Vercel sean correctas (sin espacios extra).

**"No me llega el email de confirmación"**
→ Revisá spam. Si usás Gmail, buscá emails de `noreply@mail.app.supabase.io`.

**"El link del email dice que expiró"**
→ Los magic links expiran en 1 hora. Pedí uno nuevo.

**Quiero actualizar el código**
→ Subí los archivos nuevamente a GitHub (reemplazando los existentes). Vercel redespliega automáticamente.

---

## Estructura del proyecto

```
prode-mundial-2026/
├── package.json          ← dependencias
├── vite.config.js        ← configuración del bundler
├── index.html            ← punto de entrada HTML
├── .env.example          ← template de variables de entorno
├── src/
│   ├── main.jsx          ← inicialización de React
│   ├── App.jsx           ← toda la UI del PRODE
│   ├── data.js           ← los 72 partidos y helpers
│   ├── db.js             ← todas las operaciones con Supabase
│   ├── index.css         ← estilos
│   └── lib/
│       └── supabase.js   ← cliente de Supabase
└── supabase/
    └── schema.sql        ← esquema completo de la base de datos
```

---

## Sistema de puntaje

| Resultado | Puntos |
|---|---|
| Marcador exacto (ej: pronosticaste 2-1 y fue 2-1) | **5** |
| Empate acertado (pronosticaste empate y fue empate) | **5** |
| Solo acertaste el ganador (ej: pronosticaste 1-0 y fue 3-1) | **3** |
| No acertaste el ganador pero le pegaste a un marcador | **1** |
| No acertaste nada | **0** |

---

*Hecho con Claude · Mundial 2026 · Supabase + Vercel*

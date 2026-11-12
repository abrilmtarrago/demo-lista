# Lista de compras — demo React + Vite + Firebase

App mínima de ejemplo para entender el circuito completo:
**React en el navegador → Cloud Firestore en la nube → GitHub → Vercel.**

Permite agregar items, marcarlos como comprados, volverlos a pendientes y
eliminarlos. Todo queda guardado en Firestore, así que al recargar la página
sigue estando.

---

## 1. Correrla en tu compu

```bash
npm install          # instala las librerías (crea node_modules)
cp .env.example .env # creá tu archivo de claves
# completá .env con los datos de tu proyecto de Firebase
npm run dev          # abre http://localhost:5173
```

> Después de cambiar el `.env` hay que **reiniciar** `npm run dev`. Vite lee ese
> archivo una sola vez, al arrancar.

## 2. Configurar Firebase

1. Crear un proyecto en https://console.firebase.google.com/
2. Registrar una app web con el botón `</>`. Copiar el objeto `firebaseConfig`.
3. Pasar esos valores al `.env` (uno por línea, sin comillas ni comas).
4. **Authentication → Métodos de acceso → Anónimo → Habilitar.**
5. **Firestore Database → Crear base de datos** → modo producción → región
   `southamerica-east1` (São Paulo).
6. **Firestore → Reglas** → pegar el contenido de `firestore.rules` → Publicar.

## 3. Publicar en Vercel

1. Subir el repo a GitHub.
2. En Vercel: **Add New → Project → Import** el repo.
3. Framework: **Vite** · Build: `npm run build` · Output: `dist`
4. **Settings → Environment Variables**: cargar las 4 variables `VITE_...`
   para el entorno *Production*.
5. Deploy.
6. **Firebase → Authentication → Settings → Dominios autorizados**: agregar el
   dominio de Vercel (`tu-proyecto.vercel.app`). Sin esto el login anónimo
   falla en producción y la app no lee ni escribe nada.

---

## Dónde está cada cosa (mapa del código)

| Archivo | Qué hace |
|---|---|
| `src/firebase.js` | **Acá se conecta Firebase.** Lee el `.env`, inicializa la app y exporta `db` (Firestore) y `auth` (login). |
| `src/App.jsx` | Toda la interfaz y las 4 operaciones de base de datos. |
| `src/index.css` | Estilos. Responsive para celular. |
| `firestore.rules` | Reglas de seguridad. Se publican en Firebase, no en Vercel. |
| `.env` | Claves reales. **No se sube a GitHub** (está en `.gitignore`). |
| `.env.example` | Los nombres de las variables, sin valores. Este sí se sube. |

## Las 4 operaciones de Firestore

Todas están en `src/App.jsx`, cada una con su comentario:

| Operación | Función de Firebase | Dónde |
|---|---|---|
| Consultar | `onSnapshot` + `query` / `where` / `orderBy` | `useEffect` de lectura |
| Agregar | `addDoc` | `agregar()` |
| Modificar | `updateDoc` | `alternar()` |
| Eliminar | `deleteDoc` | `eliminar()` |

`onSnapshot` no consulta una sola vez: queda escuchando. Si el dato cambia en
Firestore, la pantalla se actualiza sola, sin recargar.

## Modelo de datos

Colección `items`, un documento por item:

```js
{
  nombre:   "yerba",      // string, 1 a 60 caracteres
  comprado: false,        // boolean
  uid:      "abc123...",  // dueño del item (del login anónimo)
  creadoEn: Timestamp     // fecha puesta por el servidor
}
```

El campo `uid` es lo que hace que las reglas funcionen: cada visitante ve
únicamente sus propios items.

> Al usar login anónimo, cada navegador tiene una identidad distinta. Abrir la
> app en el celu no muestra la lista de la compu: son dos usuarios anónimos
> diferentes. Eso es esperado.

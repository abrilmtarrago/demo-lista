// ============================================================
//  AQUÍ SE CONECTA FIREBASE  (este es EL archivo que te va a preguntar el profe)
// ============================================================
// Este archivo hace 3 cosas y nada más:
//   1. Lee las claves del proyecto de Firebase desde el archivo .env
//   2. Inicializa la conexión con Firebase
//   3. Exporta las 2 herramientas que usa el resto de la app:
//        - db   -> la base de datos (Firestore)
//        - auth -> el login (en este caso, anónimo)

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// import.meta.env es la forma que tiene Vite de leer el archivo .env
// Por eso las variables TIENEN que empezar con VITE_ : si no, Vite las ignora.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Inicializa la app de Firebase con esas claves
const app = initializeApp(firebaseConfig)

// db = la base de datos. Todo lo que guardemos pasa por acá.
export const db = getFirestore(app)

// auth = la identidad del visitante. Lo usamos para que cada persona
// vea solo su propia lista, sin tener que hacer pantalla de registro.
export const auth = getAuth(app)

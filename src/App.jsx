import { useEffect, useState } from 'react'
import { db, auth } from './firebase'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
// Estas 7 funciones son TODAS las operaciones de base de datos que usa la app:
import {
  collection,   // apunta a una colección (como una "tabla")
  query,        // arma una consulta
  where,        // filtra (acá: solo los items de este usuario)
  onSnapshot,   // CONSULTAR en tiempo real (se actualiza solo)
  addDoc,       // AGREGAR un documento
  updateDoc,    // MODIFICAR un documento
  deleteDoc,    // ELIMINAR un documento
  doc,          // apunta a un documento puntual por su id
  serverTimestamp,
} from 'firebase/firestore'
import './index.css'

export default function App() {
  const [uid, setUid] = useState(null)        // quién soy (identidad anónima)
  const [items, setItems] = useState([])      // la lista que viene de Firestore
  const [texto, setTexto] = useState('')      // lo que escribo en el input
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  // Muestra un cartel verde que se va solo
  const avisar = (msg) => {
    setExito(msg)
    setTimeout(() => setExito(''), 2000)
  }

  // --- 1) LOGIN ANÓNIMO -------------------------------------------------
  // Al abrir la app, Firebase nos da una identidad anónima.
  // Sirve para que las reglas de seguridad sepan de quién es cada dato.
  useEffect(() => {
    const cortar = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
      } else {
        signInAnonymously(auth).catch(() => {
          setError('No se pudo iniciar sesión. Revisá la conexión con Firebase.')
          setCargando(false)
        })
      }
    })
    return cortar // al desmontar el componente, cortamos la escucha
  }, [])

  // --- 2) CONSULTAR (READ) ---------------------------------------------
  // onSnapshot queda "escuchando" la colección: si algo cambia en Firestore,
  // la pantalla se actualiza sola. Esto es la persistencia en tiempo real.
  useEffect(() => {
    if (!uid) return

    // Filtramos por usuario en Firestore. El orden lo hacemos después, en el
    // navegador: si pidiéramos where + orderBy juntos, Firestore exigiría
    // crear un índice compuesto a mano en la consola.
    const consulta = query(
      collection(db, 'items'),          // colección "items"
      where('uid', '==', uid),          // solo los míos
    )

    const cortar = onSnapshot(
      consulta,
      (snap) => {
        const datos = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        // Los más nuevos primero. creadoEn puede venir null por un instante,
        // justo después de agregar, hasta que el servidor pone la fecha.
        datos.sort((a, b) => (b.creadoEn?.seconds ?? 0) - (a.creadoEn?.seconds ?? 0))
        setItems(datos)
        setCargando(false)
        setError('')
      },
      (err) => {
        // Mostramos el código real de Firebase para poder diagnosticar.
        setError(`No se pudieron leer los datos. Error de Firebase: ${err.code}`)
        console.error('Error de Firestore:', err)
        setCargando(false)
      },
    )
    return cortar
  }, [uid])

  // --- 3) AGREGAR (CREATE) ---------------------------------------------
  const agregar = async (e) => {
    e.preventDefault()

    // Validaciones básicas (la consigna las pide)
    const limpio = texto.trim()
    if (!limpio) return setError('Escribí algo antes de agregar.')
    if (limpio.length > 60) return setError('Máximo 60 caracteres.')

    setError('')
    setGuardando(true)
    try {
      await addDoc(collection(db, 'items'), {
        nombre: limpio,
        comprado: false,
        uid,                          // marca de dueño: lo exigen las reglas
        creadoEn: serverTimestamp(),  // fecha puesta por el servidor
      })
      setTexto('')
      avisar('Agregado')
    } catch (err) {
      setError(`No se pudo guardar, el dato no quedó en la base. Error: ${err.code}`)
    } finally {
      setGuardando(false)
    }
  }

  // --- 4) MODIFICAR (UPDATE) -------------------------------------------
  // Cambia el estado comprado/pendiente de un item.
  const alternar = async (item) => {
    try {
      await updateDoc(doc(db, 'items', item.id), { comprado: !item.comprado })
      avisar(item.comprado ? 'Marcado como pendiente' : 'Marcado como comprado')
    } catch (err) {
      setError(`No se pudo modificar el item. Error: ${err.code}`)
    }
  }

  // --- 5) ELIMINAR (DELETE) --------------------------------------------
  const eliminar = async (item) => {
    try {
      await deleteDoc(doc(db, 'items', item.id))
      avisar('Eliminado')
    } catch (err) {
      setError(`No se pudo eliminar el item. Error: ${err.code}`)
    }
  }

  const pendientes = items.filter((i) => !i.comprado).length

  return (
    <main className="app">
      <header>
        <h1>Lista de compras v2</h1>
        <p className="sub">
          {cargando ? 'Cargando…' : `${pendientes} pendiente${pendientes === 1 ? '' : 's'} de ${items.length}`}
        </p>
      </header>

      <form onSubmit={agregar}>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ej: yerba"
          maxLength={70}
          aria-label="Nuevo item"
        />
        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Agregar'}
        </button>
      </form>

      {/* Mensajes de error y de éxito: la consigna los pide explícitamente */}
      {error && <p className="msg error" role="alert">{error}</p>}
      {exito && <p className="msg ok">{exito}</p>}

      {cargando ? (
        <p className="vacio">Trayendo datos de Firestore…</p>
      ) : items.length === 0 ? (
        <p className="vacio">Todavía no hay nada. Agregá el primer item.</p>
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className={item.comprado ? 'listo' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={item.comprado}
                  onChange={() => alternar(item)}
                />
                <span>{item.nombre}</span>
              </label>
              <button className="borrar" onClick={() => eliminar(item)} aria-label="Eliminar">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer>
        Los datos se guardan en Cloud Firestore. Recargá la página: siguen ahí.
      </footer>
    </main>
  )
}

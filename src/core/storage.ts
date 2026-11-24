const open = () => new Promise<IDBDatabase>((res, rej) => { const r = indexedDB.open('past-present', 1); r.onupgradeneeded = () => r.result.createObjectStore('lists'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) })
const tx = async <T,>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => { const db = await open(); return new Promise<T>((res, rej) => { const r = fn(db.transaction('lists', mode).objectStore('lists')); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) }) }
export const saveList = <T,>(name: string, v: T) => tx('readwrite', s => s.put(v, name))
export const loadList = <T,>(name: string) => tx<T | undefined>('readonly', s => s.get(name))
export const listNames = () => tx<IDBValidKey[]>('readonly', s => s.getAllKeys()).then(k => k.map(String))
export const deleteList = (name: string) => tx('readwrite', s => s.delete(name))

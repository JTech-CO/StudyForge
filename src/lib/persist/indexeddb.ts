import { openDB, type IDBPDatabase } from 'idb';
import type { Notebook } from '../store';

const DB_NAME = 'studyforge';
const STORE = 'notebooks';
const VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export interface NotebookSummary {
  id: string;
  title: string;
  createdAt: string;
}

export async function saveNotebook(nb: Notebook): Promise<void> {
  const db = await getDb();
  await db.put(STORE, nb);
}

export async function getNotebook(id: string): Promise<Notebook | undefined> {
  const db = await getDb();
  return (await db.get(STORE, id)) as Notebook | undefined;
}

export async function listNotebooks(): Promise<NotebookSummary[]> {
  const db = await getDb();
  const all = (await db.getAll(STORE)) as Notebook[];
  return all
    .map((n) => ({ id: n.id, title: n.title, createdAt: n.createdAt }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteNotebook(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
}

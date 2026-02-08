
const DB_NAME = 'rpg-reference-db';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';

export interface PDFMetadata {
  id: string;
  name: string;
  system: string;
  size: number;
  type: string;
  createdAt: number;
}

export interface PDFRecord extends PDFMetadata {
  file: Blob;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('system', 'system', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });

  return dbPromise;
}

export async function savePDF(system: string, file: File): Promise<PDFMetadata> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const record: PDFRecord = {
    id,
    name: file.name,
    system,
    size: file.size,
    type: file.type,
    createdAt: Date.now(),
    file,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(record);

    request.onsuccess = () => {
      const { file, ...metadata } = record;
      resolve(metadata);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPDFs(system?: string): Promise<PDFMetadata[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = system 
      ? store.index('system').getAll(IDBKeyRange.only(system))
      : store.getAll();

    request.onsuccess = () => {
      const records = request.result as PDFRecord[];
      // Remove o blob pesado da listagem para economizar memória
      const metadata = records.map(({ file, ...meta }) => meta);
      resolve(metadata.sort((a, b) => b.createdAt - a.createdAt));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getPDF(id: string): Promise<Blob | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const record = request.result as PDFRecord;
      resolve(record ? record.file : null);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deletePDF(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

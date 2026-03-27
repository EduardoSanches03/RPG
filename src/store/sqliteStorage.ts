import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import type { RpgDataV1 } from "../domain/rpg";
import { normalizeRpgDataV1 } from "./rpgStorage";

const SQLITE_DB_STORAGE_KEY = "rpg-dashboard:sqlite-db";
const RPG_DATA_ROW_KEY = "rpg-data-v1";

let sqlJsPromise: Promise<SqlJsStatic> | null = null;
let dbPromise: Promise<Database> | null = null;

function getSqlJs() {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: () => new URL("sql.js/dist/sql-wasm.wasm", import.meta.url).toString(),
    });
  }
  return sqlJsPromise;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function persistDb(db: Database) {
  const serializedDb = db.export();
  localStorage.setItem(SQLITE_DB_STORAGE_KEY, bytesToBase64(serializedDb));
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await getSqlJs();
      const savedDb = localStorage.getItem(SQLITE_DB_STORAGE_KEY);
      const db = savedDb
        ? new SQL.Database(base64ToBytes(savedDb))
        : new SQL.Database();

      db.run(
        "CREATE TABLE IF NOT EXISTS app_store (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
      );
      await persistDb(db);
      return db;
    })();
  }

  return dbPromise;
}

function normalizeStorageOwnerId(userIdInput?: string) {
  const userId = userIdInput?.trim();
  return userId && userId.length > 0 ? userId : "local-user";
}

function getRowKey(userIdInput?: string) {
  return `${RPG_DATA_ROW_KEY}:${normalizeStorageOwnerId(userIdInput)}`;
}

export async function loadRpgDataFromSqlite(userIdInput?: string): Promise<RpgDataV1 | null> {
  try {
    const db = await getDb();
    const stmt = db.prepare("SELECT value FROM app_store WHERE key = ?");
    stmt.bind([getRowKey(userIdInput)]);
    if (!stmt.step()) {
      stmt.free();
      if (normalizeStorageOwnerId(userIdInput) !== "local-user") return null;

      const legacyStmt = db.prepare("SELECT value FROM app_store WHERE key = ?");
      legacyStmt.bind([RPG_DATA_ROW_KEY]);
      if (!legacyStmt.step()) {
        legacyStmt.free();
        return null;
      }

      const legacyRow = legacyStmt.getAsObject() as { value?: unknown };
      legacyStmt.free();
      if (typeof legacyRow.value !== "string") return null;
      return normalizeRpgDataV1(JSON.parse(legacyRow.value) as unknown);
    }

    const row = stmt.getAsObject() as { value?: unknown };
    stmt.free();
    if (typeof row.value !== "string") return null;

    return normalizeRpgDataV1(JSON.parse(row.value) as unknown);
  } catch {
    return null;
  }
}

export async function saveRpgDataToSqlite(data: RpgDataV1, userIdInput?: string) {
  try {
    const db = await getDb();
    db.run(
      `
      INSERT INTO app_store (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `,
      [getRowKey(userIdInput), JSON.stringify(data)],
    );

    await persistDb(db);
  } catch {
    // Fallback silencioso: localStorage e nuvem continuam funcionando mesmo sem SQLite.
  }
}

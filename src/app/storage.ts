const IMPORT_KEY = "carnet.import.v1";

export interface StoredImport {
  name: string;
  csv: string;
  savedAt: string;
}

export function readStoredImport(): StoredImport | null {
  try {
    const raw = localStorage.getItem(IMPORT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredImport>;
    if (typeof parsed.csv !== "string" || typeof parsed.name !== "string") return null;
    return { name: parsed.name, csv: parsed.csv, savedAt: parsed.savedAt ?? "" };
  } catch {
    return null;
  }
}

export function writeStoredImport(value: StoredImport): boolean {
  try {
    localStorage.setItem(IMPORT_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredImport(): void {
  try {
    localStorage.removeItem(IMPORT_KEY);
  } catch {
    /* Private mode can reject storage writes. The in-memory ledger still works. */
  }
}

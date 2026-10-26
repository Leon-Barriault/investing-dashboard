import { useCallback, useEffect, useState } from "react";
import { toLedger, type Ledger } from "../domain/ledger.ts";
import { parseWealthsimpleCsv } from "../parsing/parseWealthsimpleCsv.ts";
import { clearStoredImport, readStoredImport, writeStoredImport } from "./storage.ts";

const SAMPLE_URL = `${import.meta.env.BASE_URL}data/sample-activity.csv`;
const SAMPLE_NAME = "Synthetic sample";

export type LedgerOrigin = "sample" | "import";

export type LedgerState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; ledger: Ledger; origin: LedgerOrigin; persisted: boolean; fileName: string };

function warningsFor(errors: { rowNumber: number; message: string }[]): string[] {
  const shown = errors.slice(0, 5).map((issue) => `Row ${issue.rowNumber}: ${issue.message}`);
  if (errors.length > 5) shown.push(`${errors.length - 5} more rows were skipped.`);
  return shown;
}

export function useLedger() {
  const [state, setState] = useState<LedgerState>({ status: "loading" });

  const accept = useCallback(
    (text: string, fileName: string, origin: LedgerOrigin, persisted: boolean): string | null => {
      const parsed = parseWealthsimpleCsv(text);
      if (parsed.fatal) return parsed.fatal;
      setState({
        status: "ready",
        ledger: toLedger(parsed.activities, warningsFor(parsed.errors), fileName),
        origin,
        persisted,
        fileName,
      });
      return null;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const stored = readStoredImport();
      if (stored) {
        const fatal = accept(stored.csv, stored.name, "import", true);
        if (!fatal) return;
        clearStoredImport();
      }
      try {
        const response = await fetch(SAMPLE_URL);
        if (!response.ok) throw new Error("The synthetic sample could not be loaded.");
        const text = await response.text();
        if (cancelled) return;
        const fatal = accept(text, SAMPLE_NAME, "sample", false);
        if (fatal) setState({ status: "error", message: fatal });
      } catch (error) {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load the export.",
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [accept]);

  const importCsv = useCallback(
    (text: string, fileName: string): string | null => {
      const fatal = accept(text, fileName, "import", false);
      if (fatal) return fatal;
      const persisted = writeStoredImport({
        name: fileName,
        csv: text,
        savedAt: new Date().toISOString(),
      });
      setState((current) =>
        current.status === "ready"
          ? { ...current, persisted, origin: "import", fileName }
          : current,
      );
      return null;
    },
    [accept],
  );

  const restoreBundled = useCallback(async () => {
    clearStoredImport();
    setState({ status: "loading" });
    try {
      const response = await fetch(SAMPLE_URL);
      if (!response.ok) throw new Error("The synthetic sample could not be loaded.");
      const text = await response.text();
      const fatal = accept(text, SAMPLE_NAME, "sample", false);
      if (fatal) setState({ status: "error", message: fatal });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not load the export.",
      });
    }
  }, [accept]);

  return { state, importCsv, restoreBundled };
}

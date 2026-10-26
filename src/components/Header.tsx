import { Moon, Sun } from "lucide-react";
import { formatDay } from "@/domain/dates";
import { formatCount } from "@/view/format";
import { useTheme } from "@/app/theme";
import { Button } from "@/components/ui/button";
import { ImportDialog } from "@/components/ImportDialog";

export function Header({
  minDate,
  maxDate,
  rows,
  fileName,
  origin,
  persisted,
  onImport,
  onRestore,
}: {
  minDate: string | null;
  maxDate: string | null;
  rows: number;
  fileName: string;
  origin: "sample" | "import";
  persisted: boolean;
  onImport: (text: string, fileName: string) => string | null;
  onRestore: () => void;
}) {
  const { theme, toggle } = useTheme();
  const range =
    minDate && maxDate ? `${formatDay(minDate)} – ${formatDay(maxDate)}` : "No dated rows";
  return (
    <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-primary text-xs font-medium tracking-[0.18em] uppercase">
          Wealthsimple ledger
        </p>
        <h1 className="font-heading text-4xl font-medium tracking-tight italic">Carnet</h1>
        <p className="text-muted-foreground mt-1 max-w-xl text-sm">
          {range} · {formatCount(rows)} rows · {origin === "import" ? fileName : "synthetic sample"}
          {origin === "import" && persisted ? " · saved in this browser" : ""}
          {origin === "import" && !persisted ? " · this visit only" : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {origin === "import" ? (
          <Button type="button" variant="ghost" onClick={onRestore}>
            Use synthetic sample
          </Button>
        ) : null}
        <ImportDialog onImport={onImport} />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggle}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  );
}

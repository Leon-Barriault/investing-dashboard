import { useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ImportDialog({
  onImport,
}: {
  onImport: (text: string, fileName: string) => string | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  async function takeFile(file: File) {
    setReading(true);
    setError(null);
    try {
      const text = await file.text();
      const fatal = onImport(text, file.name);
      if (fatal) {
        setError(fatal);
        return;
      }
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read that file.");
    } finally {
      setReading(false);
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void takeFile(file);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Upload />
          Import export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import a Wealthsimple export</DialogTitle>
          <DialogDescription>
            Drop the French activity CSV. It is parsed in this browser and can be remembered on this
            device. Nothing is uploaded.
          </DialogDescription>
        </DialogHeader>
        <label
          className="hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center text-sm"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <Upload className="text-muted-foreground size-5" />
          <span>{reading ? "Reading…" : "Choose a CSV or drop it here"}</span>
          <span className="text-muted-foreground text-xs">
            Columns such as date_effet, type_activite, montant_net_especes
          </span>
          <input
            aria-label="Wealthsimple CSV file"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void takeFile(file);
            }}
          />
        </label>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

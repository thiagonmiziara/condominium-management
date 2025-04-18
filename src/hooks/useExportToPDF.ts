import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { jsPDF } from "jspdf";

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY?: number;
  };
}

interface ExportConfig<T> {
  data: T[];
  headers: string[][];
  mapFunction: (item: T) => (string | number)[];
  filename: string;
  extraTextFunction?: (doc: jsPDF, finalY: number) => void;
}

export function useExportToPDF<T>() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportToPDF = useCallback(async (config: ExportConfig<T>) => {
    const { data, headers, mapFunction, filename, extraTextFunction } = config;

    if (data.length === 0) {
      toast.info("Nenhum dado para exportar.");
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();

      const body = data.map(mapFunction);

      autoTable(doc, {
        head: headers,
        body: body,
        startY: 10,
        headStyles: { fillColor: [22, 160, 133] },
      });

      if (extraTextFunction) {
        const finalY = (doc as jsPDFWithAutoTable).lastAutoTable?.finalY || 20;
        extraTextFunction(doc, finalY);
      }

      doc.save(filename);
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro desconhecido ao gerar PDF";
      console.error(`Erro ao exportar ${filename}:`, err);
      setExportError(errorMsg);
      toast.error("Erro ao exportar para PDF", { description: errorMsg });
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, exportError, exportToPDF };
}

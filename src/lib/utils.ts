import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "R$ 0,00"; // Ou outra representação para nulo/indefinido
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  try {
    // Tenta criar um objeto Date. Se a string for apenas YYYY-MM-DD,
    // adicionar T00:00:00 ajuda a evitar problemas de fuso horário UTC.
    const dateObj =
      typeof date === "string" && !date.includes("T")
        ? new Date(date + "T00:00:00")
        : new Date(date);
    if (isNaN(dateObj.getTime())) return "-"; // Retorna '-' se a data for inválida
    return dateObj.toLocaleDateString("pt-BR", { timeZone: "UTC" }); // Especifica UTC para consistência
  } catch (e) {
    console.error("Erro ao formatar data:", e);
    return "-";
  }
};

// Função para formatar data para input type="date" (YYYY-MM-DD)
export const formatDateForInput = (
  date: string | Date | null | undefined
): string => {
  if (!date) return "";
  try {
    const dateObj =
      typeof date === "string" && !date.includes("T")
        ? new Date(date + "T00:00:00")
        : new Date(date);
    if (isNaN(dateObj.getTime())) return ""; // Retorna '' se a data for inválida

    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0"); // Month is 0-indexed
    const day = dateObj.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Erro ao formatar data para input:", e);
    return "";
  }
};

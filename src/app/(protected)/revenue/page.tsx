"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserRole } from "@prisma/client";
import { PlusCircle, Pencil, Trash2, Download, Loader2 } from "lucide-react"; // Added Download and Loader2 icons
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import RevenueForm from "./revenue-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useExportToPDF } from "@/hooks/useExportToPDF";
import type { jsPDF } from "jspdf";

interface Revenue {
  id: string;
  description: string;
  value: number;
  date: string | Date;
  createdAt?: string;
  updatedAt?: string;
}

export default function RevenuePage() {
  const { data: session } = useSession();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  // State for data fetching
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // State for form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);

  const isSindico = session?.user?.role === UserRole.SINDICO;

  const { exportToPDF: exportRevenuesToPDF, isExporting } =
    useExportToPDF<Revenue>();

  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    setFetchError(null);
    try {
      const response = await fetch("/api/revenue");
      if (!response.ok) throw new Error("Falha ao buscar receitas");
      const data = await response.json();
      setRevenues(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setFetchError(errorMsg);
      toast.error("Erro ao buscar dados", { description: errorMsg });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingRevenue(null);
    setIsFormOpen(true);
  };

  const handleEdit = (revenue: Revenue) => {
    setEditingRevenue(revenue);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/revenue/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao deletar receita");
      }
      toast.success("Receita deletada com sucesso.");
      fetchData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao deletar";
      console.error("Erro ao deletar:", err);
      toast.error("Erro ao deletar", { description: errorMsg });
      setFetchError(errorMsg);
    }
  };

  const handleFormSaveSuccess = () => {
    setIsFormOpen(false);
    setEditingRevenue(null);
    fetchData();
  };

  const handleExportClick = () => {
    exportRevenuesToPDF({
      data: revenues,
      headers: [["Descrição", "Data", "Valor"]],
      mapFunction: (revenue) => [
        revenue.description,
        formatDate(revenue.date),
        formatCurrency(revenue.value),
      ],
      filename: "receitas.pdf",
      extraTextFunction: (doc: jsPDF, finalY: number) => {
        const currentTotalValue = revenues.reduce(
          (sum, item) => sum + item.value,
          0
        );
        doc.setFontSize(12);
        doc.text(
          `Total de Receitas: ${formatCurrency(currentTotalValue)}`,
          14,
          finalY + 10
        );
      },
    });
  };

  const ActionButtons = ({ item }: { item: Revenue }) => (
    <div className='flex justify-end gap-1 sm:gap-2'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => handleEdit(item)}
        title='Editar'
        className='h-8 w-8 sm:h-auto sm:w-auto'
      >
        <Pencil className='h-4 w-4 text-zinc-400 hover:text-cyan-400' />
        <span className='sr-only'>Editar</span>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='text-red-500 hover:text-red-400 h-8 w-8 sm:h-auto sm:w-auto'
            title='Deletar'
          >
            <Trash2 className='h-4 w-4' />
            <span className='sr-only'>Deletar</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className='bg-zinc-900 border-zinc-800 text-zinc-200'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-cyan-400'>
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className='text-zinc-400'>
              Tem certeza que deseja excluir a receita {item.description}? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border-zinc-700 hover:bg-zinc-800'>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(item.id)}
              className='bg-red-600 text-red-foreground hover:bg-red-700'
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className='space-y-6 p-4 sm:p-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <h2 className='text-2xl font-semibold text-cyan-400'>
          Gerenciar Receitas
        </h2>
        <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
          {isSindico && (
            <Dialog
              open={isFormOpen}
              onOpenChange={(open) => {
                setIsFormOpen(open);
                if (!open) setEditingRevenue(null);
              }}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={handleAdd}
                  className='w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white order-last sm:order-none' // Adjust order for mobile
                >
                  <PlusCircle className='mr-2 h-4 w-4' /> Adicionar Receita
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-200'>
                <DialogHeader>
                  <DialogTitle className='text-cyan-400'>
                    {editingRevenue ? "Editar Receita" : "Adicionar Receita"}
                  </DialogTitle>
                  <DialogDescription className='text-zinc-400'>
                    Preencha os detalhes da receita aqui.
                  </DialogDescription>
                </DialogHeader>
                <RevenueForm
                  revenueData={editingRevenue}
                  onSaveSuccess={handleFormSaveSuccess}
                  onCancel={() => setIsFormOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}

          <Button
            onClick={handleExportClick}
            className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white'
            disabled={isExporting || isLoadingData || revenues.length === 0}
          >
            {isExporting ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Download className='mr-2 h-4 w-4' />
            )}
            {isExporting ? "Exportando..." : "Exportar para PDF"}
          </Button>
        </div>
      </div>
      <div className='text-right font-semibold text-lg text-zinc-300 pr-2'>
        Total de Receitas:
        <span className='text-green-500'>
          {formatCurrency(revenues.reduce((sum, item) => sum + item.value, 0))}
        </span>
      </div>

      {isLoadingData && (
        <p className='text-center text-zinc-400 py-10'>
          Carregando receitas...
        </p>
      )}

      {!isLoadingData && fetchError && (
        <div className='bg-destructive/10 border border-destructive/50 text-destructive p-4 rounded-md text-center'>
          <p>Erro ao carregar dados: {fetchError}</p>
          <Button
            onClick={fetchData}
            variant='destructive'
            size='sm'
            className='mt-2'
          >
            Tentar Novamente
          </Button>
        </div>
      )}

      {!isLoadingData && !fetchError && (
        <>
          <div className='hidden md:block border rounded-lg shadow-sm bg-zinc-900 border-zinc-800 overflow-hidden'>
            <Table>
              <TableCaption className='text-zinc-500 py-3'>
                {revenues.length > 0
                  ? "Lista das últimas receitas registradas."
                  : "Nenhuma receita registrada."}
              </TableCaption>
              <TableHeader>
                <TableRow className='border-zinc-800 hover:bg-zinc-800/50'>
                  <TableHead className='text-zinc-300 pl-4'>
                    Descrição
                  </TableHead>
                  <TableHead className='text-zinc-300'>Data</TableHead>
                  <TableHead className='text-right text-zinc-300'>
                    Valor
                  </TableHead>
                  {isSindico && (
                    <TableHead className='text-center w-[100px] text-zinc-300 pr-4'>
                      Ações
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.length === 0 && (
                  <TableRow className='border-zinc-800'>
                    <TableCell
                      colSpan={isSindico ? 4 : 3}
                      className='h-24 text-center text-zinc-400'
                    >
                      Nenhuma receita encontrada.
                      {isSindico &&
                        " Clique em 'Adicionar Receita' para começar."}
                    </TableCell>
                  </TableRow>
                )}
                {revenues.map((revenue) => (
                  <TableRow
                    key={revenue.id}
                    className='border-zinc-800 hover:bg-zinc-800/50'
                  >
                    <TableCell className='font-medium text-zinc-100 pl-4'>
                      {revenue.description}
                    </TableCell>
                    <TableCell className='text-zinc-400'>
                      {formatDate(revenue.date)}
                    </TableCell>
                    <TableCell className='text-right text-green-500 font-medium'>
                      {formatCurrency(revenue.value)}
                    </TableCell>
                    {isSindico && (
                      <TableCell className='text-center pr-4'>
                        <ActionButtons item={revenue} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='block md:hidden space-y-3'>
            {revenues.length === 0 && (
              <p className='text-center text-zinc-400 py-10'>
                Nenhuma receita encontrada.
                {isSindico && " Toque em 'Adicionar Receita' para começar."}
              </p>
            )}
            {revenues.map((revenue) => (
              <Card
                key={revenue.id}
                className='bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-md'
              >
                <CardHeader className='pb-2 pt-3 px-4 flex flex-row justify-between items-start'>
                  <div>
                    <CardTitle className='text-base text-zinc-100 leading-tight font-medium'>
                      {revenue.description}
                    </CardTitle>
                    <CardDescription className='text-xs text-zinc-400 pt-1'>
                      {formatDate(revenue.date)}
                    </CardDescription>
                  </div>
                  {isSindico && (
                    <div className='flex-shrink-0 -mr-2 -mt-1'>
                      <ActionButtons item={revenue} />
                    </div>
                  )}
                </CardHeader>
                <CardContent className='pt-1 pb-3 px-4'>
                  <p className='text-lg font-semibold text-green-500'>
                    {formatCurrency(revenue.value)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

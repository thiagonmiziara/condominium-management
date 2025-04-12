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
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import ExpenseForm from "./expense-form";
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

interface Expense {
  id: string;
  description: string;
  category: string | null;
  value: number;
  date: string | Date;
  createdAt?: string;
  updatedAt?: string;
}

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const isSindico = session?.user?.role === UserRole.SINDICO;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/expenses"); // Busca despesas
      if (!response.ok) throw new Error("Falha ao buscar despesas");
      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMsg);
      toast.error("Erro ao buscar dados", { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao deletar despesa");
      }
      toast.success("Despesa deletada com sucesso.");
      fetchData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao deletar";
      console.error("Erro ao deletar:", err);
      toast.error("Erro ao deletar", { description: errorMsg });
      setError(errorMsg);
    }
  };

  const handleFormSaveSuccess = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
    fetchData();
  };

  const totalValue = expenses.reduce((sum, item) => sum + item.value, 0);

  const ActionButtons = ({ item }: { item: Expense }) => (
    <div className='flex justify-end gap-2'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => handleEdit(item)}
        title='Editar'
      >
        <Pencil className='h-4 w-4 text-zinc-400 hover:text-zinc-100' />{" "}
        <span className='sr-only'>Editar</span>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='text-red-500 hover:text-red-400'
            title='Deletar'
          >
            <Trash2 className='h-4 w-4' />
            <span className='sr-only'>Deletar</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a despesa {item.description}? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(item.id)}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <h2 className='text-2xl font-semibold text-cyan-400'>
          Gerenciar Despesas
        </h2>
        {isSindico && (
          <Dialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) setEditingExpense(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={handleAdd}
                className='w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white'
              >
                <PlusCircle className='mr-2 h-4 w-4' /> Adicionar Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-200'>
              <DialogHeader>
                <DialogTitle className='text-cyan-400'>
                  {editingExpense ? "Editar Despesa" : "Adicionar Despesa"}
                </DialogTitle>
                <DialogDescription className='text-zinc-400'>
                  Preencha os detalhes da despesa aqui.
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm
                expenseData={editingExpense}
                onSaveSuccess={handleFormSaveSuccess}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className='text-right font-semibold text-lg text-zinc-300 pr-2'>
        Total de Despesas:{" "}
        <span className='text-red-500'>{formatCurrency(totalValue)}</span>{" "}
      </div>

      {isLoading && (
        <p className='text-center text-zinc-400 py-10'>
          Carregando despesas...
        </p>
      )}
      {error && (
        <p className='text-destructive text-center py-10'>Erro: {error}</p>
      )}

      {!isLoading && !error && (
        <>
          <div className='hidden md:block border rounded-lg shadow-sm bg-zinc-900 border-zinc-800'>
            <Table>
              <TableCaption className='text-zinc-500'>
                Lista das últimas despesas registradas.
              </TableCaption>
              <TableHeader>
                <TableRow className='border-zinc-800'>
                  <TableHead className='text-zinc-300'>Descrição</TableHead>
                  <TableHead className='text-zinc-300'>Categoria</TableHead>
                  <TableHead className='text-zinc-300'>Data</TableHead>
                  <TableHead className='text-right text-zinc-300'>
                    Valor
                  </TableHead>
                  {isSindico && (
                    <TableHead className='text-center w-[100px] text-zinc-300'>
                      Ações
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 && (
                  <TableRow className='border-zinc-800'>
                    <TableCell
                      colSpan={isSindico ? 5 : 4}
                      className='h-24 text-center text-zinc-400'
                    >
                      Nenhuma despesa encontrada.
                    </TableCell>
                  </TableRow>
                )}
                {expenses.map((expense) => (
                  <TableRow key={expense.id} className='border-zinc-800'>
                    <TableCell className='font-medium text-zinc-100'>
                      {expense.description}
                    </TableCell>
                    <TableCell className='text-zinc-400'>
                      {expense.category || "-"}
                    </TableCell>
                    <TableCell className='text-zinc-400'>
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell className='text-right text-red-500 font-medium'>
                      {formatCurrency(expense.value)}
                    </TableCell>
                    {isSindico && (
                      <TableCell className='text-center'>
                        <ActionButtons item={expense} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='block md:hidden space-y-3'>
            {expenses.length === 0 && (
              <p className='text-center text-zinc-400 py-10'>
                Nenhuma despesa encontrada.
              </p>
            )}
            {expenses.map((expense) => (
              <Card
                key={expense.id}
                className='bg-zinc-900 border-zinc-800 text-zinc-200'
              >
                <CardHeader className='pb-3 pt-4 px-4 flex flex-row justify-between items-start'>
                  <div>
                    <CardTitle className='text-base text-zinc-100 leading-tight'>
                      {expense.description}
                    </CardTitle>
                    <CardDescription className='text-xs text-zinc-400 pt-1'>
                      {formatDate(expense.date)}{" "}
                      {expense.category ? `(${expense.category})` : ""}
                    </CardDescription>
                  </div>
                  {isSindico && (
                    <div className='flex-shrink-0 -mr-2 -mt-1'>
                      <ActionButtons item={expense} />
                    </div>
                  )}{" "}
                </CardHeader>
                <CardContent className='pt-1 pb-4 px-4'>
                  <p className='text-lg font-semibold text-red-500'>
                    {formatCurrency(expense.value)}
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

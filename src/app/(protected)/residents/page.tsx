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
import { Pencil, PlusCircle, UserX } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ResidentForm from "./residents-form";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Resident {
  id: string;
  name: string | null;
  email: string | null;
  apartment: string | null;
  role: UserRole;
  isActive: boolean;
}

export default function ResidentsPage() {
  const { data: session } = useSession();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);

  const isSindico = session?.user?.role === UserRole.SINDICO;

  const fetchData = useCallback(async () => {
    if (!isSindico && session) {
      setError("Acesso negado.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/residents");
      if (!response.ok) throw new Error("Falha ao buscar usuários");
      const data = await response.json();
      setResidents(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMsg);
      toast.error("Erro ao buscar dados", { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, [isSindico, session]);

  useEffect(() => {
    if (session && isSindico) {
      fetchData();
    } else if (session && !isSindico) {
      setError("Acesso negado.");
      setIsLoading(false);
    }
  }, [session, isSindico, fetchData]);

  const handleDeactivate = async (userId: string, userName: string | null) => {
    try {
      const response = await fetch(`/api/residents/${userId}`, {
        method: "PATCH",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao desativar usuário");
      }
      toast.success(`Usuário ${userName || userId} desativado.`);
      fetchData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao desativar";
      console.error("Erro ao desativar:", err);
      toast.error("Erro ao desativar", { description: errorMsg });
      setError(errorMsg);
    }
  };

  const handleAdd = () => {
    setEditingResident(null);
    setIsFormOpen(true);
  };

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    setIsFormOpen(true);
  };

  const handleFormSaveSuccess = () => {
    setIsFormOpen(false);
    setEditingResident(null);
    fetchData();
  };

  const ActionButtons = ({ item }: { item: Resident }) => (
    <div className='flex justify-end gap-1 sm:gap-2'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => handleEdit(item)}
        title='Editar'
      >
        <Pencil className='h-4 w-4 text-zinc-400 hover:text-cyan-400' />
        <span className='sr-only'>Editar</span>
      </Button>

      {session?.user?.id !== item.id && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='text-red-500 hover:text-red-400'
              title='Desativar'
            >
              <UserX className='h-4 w-4' />
              <span className='sr-only'>Desativar</span>
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent className='bg-zinc-900 border-zinc-800 text-zinc-200'>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-cyan-400'>
                Confirmar Desativação
              </AlertDialogTitle>
              <AlertDialogDescription className='text-zinc-400'>
                Tem certeza que deseja desativar o usuário
                {item.name || item.email} (
                {item.role === UserRole.SINDICO ? "Síndico" : "Morador"})? Ele
                não poderá mais acessar o sistema.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className='border-zinc-700 hover:bg-zinc-800'>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeactivate(item.id, item.name)}
                className='bg-red-600 text-red-foreground hover:bg-red-700'
              >
                Confirmar Desativação
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );

  if (!isSindico && session) {
    return (
      <div className='text-destructive p-4'>
        Acesso negado. Apenas síndicos podem ver esta página.
      </div>
    );
  }
  if (!session && isLoading) {
    return (
      <div className='text-center text-zinc-400 py-10'>
        Verificando acesso...
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <h2 className='text-2xl font-semibold text-cyan-400'>
          Gerenciar Usuários
        </h2>
        {isSindico && (
          <Dialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) setEditingResident(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={handleAdd}
                className='w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white'
              >
                <PlusCircle className='mr-2 h-4 w-4' /> Adicionar Morador
              </Button>
            </DialogTrigger>

            <DialogContent className='sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-200'>
              <DialogHeader>
                <DialogTitle className='text-cyan-400'>
                  {editingResident
                    ? "Editar Usuário"
                    : "Cadastrar Novo Morador"}
                </DialogTitle>
                <DialogDescription className='text-zinc-400'>
                  {editingResident
                    ? "Altere os dados do usuário abaixo. O email não pode ser alterado."
                    : "Preencha os dados do novo morador. Ele receberá um email para o primeiro acesso."}
                </DialogDescription>
              </DialogHeader>
              <ResidentForm
                residentData={editingResident}
                onSaveSuccess={handleFormSaveSuccess}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && (
        <p className='text-center text-zinc-400 py-10'>
          Carregando usuários...
        </p>
      )}
      {error && (
        <p className='text-destructive text-center py-10'>Erro: {error}</p>
      )}

      {!isLoading && !error && isSindico && (
        <>
          <div className='hidden md:block border rounded-lg shadow-sm bg-zinc-900 border-zinc-800'>
            <Table>
              <TableCaption className='text-zinc-500'>
                Lista de usuários ativos (Moradores e Síndicos).
              </TableCaption>
              <TableHeader>
                <TableRow className='border-zinc-800 hover:bg-zinc-800/50'>
                  <TableHead className='text-zinc-300'>Nome</TableHead>
                  <TableHead className='text-zinc-300'>Email</TableHead>
                  <TableHead className='text-zinc-300'>Apartamento</TableHead>
                  <TableHead className='text-zinc-300'>Função</TableHead>
                  <TableHead className='text-center w-[100px] text-zinc-300'>
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.length === 0 && (
                  <TableRow className='border-zinc-800 hover:bg-zinc-800/50'>
                    <TableCell
                      colSpan={5}
                      className='h-24 text-center text-zinc-400'
                    >
                      Nenhum usuário ativo encontrado.
                    </TableCell>
                  </TableRow>
                )}
                {residents.map((resident) => (
                  <TableRow
                    key={resident.id}
                    className='border-zinc-800 hover:bg-zinc-800/50'
                  >
                    <TableCell className='font-medium text-zinc-100'>
                      {resident.name || "-"}
                    </TableCell>
                    <TableCell className='text-zinc-400'>
                      {resident.email || "-"}
                    </TableCell>
                    <TableCell className='text-zinc-400'>
                      {resident.apartment || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          resident.role === UserRole.SINDICO
                            ? "default"
                            : "secondary"
                        }
                        className={cn(
                          resident.role === UserRole.SINDICO &&
                            "bg-cyan-600 text-cyan-foreground hover:bg-cyan-700"
                        )}
                      >
                        {resident.role === UserRole.SINDICO
                          ? "Síndico"
                          : "Morador"}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-center'>
                      <ActionButtons item={resident} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='block md:hidden space-y-3'>
            {residents.length === 0 && (
              <p className='text-center text-zinc-400 py-10'>
                Nenhum usuário ativo encontrado.
              </p>
            )}
            {residents.map((resident) => (
              <Card
                key={resident.id}
                className='bg-zinc-900 border-zinc-800 text-zinc-200 shadow-md'
              >
                <CardHeader className='pb-2 pt-4 px-4 flex flex-row justify-between items-start'>
                  <div>
                    <CardTitle className='text-base text-zinc-100 leading-tight'>
                      {resident.name || "Nome não informado"}
                    </CardTitle>
                    <CardDescription className='text-xs text-zinc-400 pt-1'>
                      {resident.email || "Email não informado"}
                    </CardDescription>
                  </div>

                  <div className='flex-shrink-0 -mr-2 -mt-1'>
                    <ActionButtons item={resident} />
                  </div>
                </CardHeader>
                <CardContent className='pt-1 pb-4 px-4 text-sm space-y-1'>
                  <p className='text-zinc-400'>
                    Apto:{" "}
                    <span className='font-medium text-zinc-300'>
                      {resident.apartment || "-"}
                    </span>
                  </p>
                  <p className='text-zinc-400'>
                    Função:{" "}
                    <Badge
                      variant={
                        resident.role === UserRole.SINDICO
                          ? "default"
                          : "secondary"
                      }
                      className={cn(
                        "text-xs h-5 px-1.5",
                        resident.role === UserRole.SINDICO &&
                          "bg-cyan-600 text-cyan-foreground hover:bg-cyan-700"
                      )}
                    >
                      {resident.role === UserRole.SINDICO
                        ? "Síndico"
                        : "Morador"}
                    </Badge>
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

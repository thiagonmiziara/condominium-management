"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { UserRole } from "@prisma/client";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import PostForm from "./post-form";
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

interface Post {
  id: string;
  title: string;
  content: string;
  authorId?: string;
  author?: { name: string | null };
  createdAt: string | Date;
  updatedAt?: string;
}

export default function BulletinPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const isSindico = session?.user?.role === UserRole.SINDICO;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) throw new Error("Falha ao buscar posts");
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMsg);
      toast.error("Erro ao buscar posts", { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = () => {
    setEditingPost(null);
    setIsFormOpen(true);
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao deletar post");
      }
      toast.success("Post deletado com sucesso.");
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
    setEditingPost(null);
    fetchData();

    toast.success(
      `Recado ${editingPost ? "atualizado" : "publicado"} com sucesso.`
    );
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <h2 className='text-2xl font-semibold text-cyan-400'>
          Mural de Recados
        </h2>
        {isSindico && (
          <Dialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setIsFormOpen(open);
              if (!open) setEditingPost(null);
            }}
          >
            <DialogTrigger asChild>
              <Button
                onClick={handleAdd}
                className='w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 text-white'
              >
                <PlusCircle className='mr-2 h-4 w-4' /> Novo Recado
              </Button>
            </DialogTrigger>

            <DialogContent className='sm:max-w-[600px] bg-zinc-900 border-zinc-800 text-zinc-200'>
              <DialogHeader>
                <DialogTitle className='text-cyan-400'>
                  {editingPost ? "Editar Recado" : "Novo Recado"}
                </DialogTitle>
                <DialogDescription className='text-zinc-400'>
                  Escreva o título e o conteúdo do recado.
                </DialogDescription>
              </DialogHeader>
              <PostForm
                postData={editingPost}
                onSaveSuccess={handleFormSaveSuccess}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && (
        <p className='text-center text-zinc-400 py-10'>Carregando recados...</p>
      )}
      {error && (
        <p className='text-destructive text-center py-10'>Erro: {error}</p>
      )}

      {!isLoading && !error && (
        <div className='space-y-4'>
          {posts.length === 0 && (
            <p className='text-center py-10 text-zinc-500'>
              Nenhum recado publicado ainda.
            </p>
          )}

          {posts.map((post) => (
            <Card
              key={post.id}
              className='bg-zinc-900 border-zinc-800 shadow-md text-zinc-200'
            >
              <CardHeader className='pb-3'>
                <CardTitle className='text-lg text-zinc-100'>
                  {post.title}
                </CardTitle>

                <CardDescription className='text-xs text-cyan-400 pt-1'>
                  Postado por {post.author?.name || "Síndico"} em{" "}
                  {formatDate(post.createdAt)}{" "}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='whitespace-pre-wrap text-zinc-300'>
                  {post.content}
                </p>
              </CardContent>

              {isSindico && (
                <CardFooter className='flex justify-end gap-2 border-t border-zinc-800 pt-3 pb-3 mt-4'>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => handleEdit(post)}
                    className='text-zinc-400 hover:text-cyan-400 px-3'
                  >
                    <Pencil className='mr-1.5 h-3 w-3' /> Editar{" "}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-red-500 hover:text-red-400 hover:bg-red-900/20 px-3' // Cor destrutiva e ajuste padding
                      >
                        <Trash2 className='mr-1.5 h-3 w-3' /> Deletar{" "}
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className='bg-zinc-900 border-zinc-800 text-zinc-200'>
                      <AlertDialogHeader>
                        <AlertDialogTitle className='text-cyan-400'>
                          Confirmar Exclusão
                        </AlertDialogTitle>
                        <AlertDialogDescription className='text-zinc-400'>
                          Tem certeza que deseja excluir o recado {post.title}?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className='border-zinc-700 hover:bg-zinc-800'>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(post.id)}
                          className='bg-red-600 text-red-50 hover:bg-red-700'
                        >
                          Confirmar Exclusão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

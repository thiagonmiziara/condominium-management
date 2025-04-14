"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Importa Textarea
import { toast } from "sonner";
import { useEffect } from "react";

const formSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Título deve ter pelo menos 3 caracteres." }),
  content: z
    .string()
    .min(10, { message: "Conteúdo deve ter pelo menos 10 caracteres." }),
});

type PostFormValues = z.infer<typeof formSchema>;

interface PostData {
  id: string;
  title: string;
  content: string;
}

interface PostFormProps {
  postData?: PostData | null;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export default function PostForm({
  postData,
  onSaveSuccess,
  onCancel,
}: PostFormProps) {
  const isEditing = !!postData;

  const form = useForm<PostFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (isEditing && postData) {
      form.reset({
        title: postData.title,
        content: postData.content,
      });
    } else if (!isEditing) {
      form.reset({
        title: "",
        content: "",
      });
    }
  }, [isEditing, postData, form]);

  async function onSubmit(values: PostFormValues) {
    const apiUrl = isEditing ? `/api/posts/${postData?.id}` : "/api/posts";
    const method = isEditing ? "PUT" : "POST";

    const dataToSend = values;

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Falha ao ${isEditing ? "atualizar" : "salvar"} recado`
        );
      }

      onSaveSuccess();
    } catch (error) {
      console.error("Erro no formulário de post:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro desconhecido.";
      toast.error("Erro ao salvar recado", { description: errorMsg });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  placeholder='Título do Recado'
                  {...field}
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='content'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conteúdo</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Digite o conteúdo do recado aqui...'
                  className='min-h-[150px] resize-y'
                  {...field}
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-2 pt-4'>
          <Button
            type='button'
            variant='ghost'
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
            className='text-zinc-300 hover:text-cyan-400 hover:bg-zinc-800'
          >
            Cancelar
          </Button>

          <Button
            type='submit'
            disabled={form.formState.isSubmitting}
            className='bg-cyan-600 hover:bg-cyan-700 text-white font-semibold'
          >
            {form.formState.isSubmitting
              ? "Salvando..."
              : isEditing
              ? "Salvar Alterações"
              : "Publicar Recado"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

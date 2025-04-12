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
import { toast } from "sonner";
import { useEffect } from "react";
import { formatDateForInput } from "@/lib/utils";

const formSchema = z.object({
  description: z
    .string()
    .min(3, { message: "Descrição deve ter pelo menos 3 caracteres." }),
  value: z.coerce.number().positive({ message: "Valor deve ser positivo." }),
  date: z.string().refine((date) => !isNaN(Date.parse(date + "T00:00:00")), {
    message: "Data inválida.",
  }),
});

type RevenueFormValues = z.infer<typeof formSchema>;

interface RevenueData {
  id: string;
  description: string;
  value: number;
  date: string | Date;
}

interface RevenueFormProps {
  revenueData?: RevenueData | null;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export default function RevenueForm({
  revenueData,
  onSaveSuccess,
  onCancel,
}: RevenueFormProps) {
  const isEditing = !!revenueData;

  const form = useForm<RevenueFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      value: 0,
      date: formatDateForInput(new Date()),
    },
  });

  useEffect(() => {
    if (isEditing && revenueData) {
      form.reset({
        description: revenueData.description,
        value: revenueData.value,
        date: formatDateForInput(revenueData.date),
      });
    } else {
      form.reset({
        description: "",
        value: 0,
        date: formatDateForInput(new Date()),
      });
    }
  }, [isEditing, revenueData, form]);

  async function onSubmit(values: RevenueFormValues) {
    const apiUrl = isEditing
      ? `/api/revenue/${revenueData?.id}`
      : "/api/revenue";
    const method = isEditing ? "PUT" : "POST";
    const dataToSend = { ...values, value: Number(values.value) };

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
            `Falha ao ${isEditing ? "atualizar" : "salvar"} receita`
        );
      }
      onSaveSuccess();
    } catch (error) {
      console.error("Erro no formulário:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Ocorreu um erro.";
      toast.error("Erro ao salvar", { description: errorMsg });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input
                  placeholder='Ex: Taxa Condominial'
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
          name='value'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input
                  type='number'
                  step='0.01'
                  placeholder='0.00'
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
          name='date'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data</FormLabel>
              <FormControl>
                <Input
                  type='date'
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
          >
            Cancelar
          </Button>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Salvando..."
              : isEditing
              ? "Salvar Alterações"
              : "Adicionar Receita"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

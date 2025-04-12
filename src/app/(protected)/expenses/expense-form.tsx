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
  category: z.string().optional(),
  value: z.coerce.number().positive({ message: "Valor deve ser positivo." }),
  date: z
    .string()
    .refine((date) => date && !isNaN(Date.parse(date + "T00:00:00")), {
      message: "Data inválida.",
    }),
});

type ExpenseFormValues = z.infer<typeof formSchema>;

interface ExpenseData {
  id: string;
  description: string;
  category: string | null;
  value: number;
  date: string | Date;
}

interface ExpenseFormProps {
  expenseData?: ExpenseData | null;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export default function ExpenseForm({
  expenseData,
  onSaveSuccess,
  onCancel,
}: ExpenseFormProps) {
  const isEditing = !!expenseData;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: expenseData?.description ?? "",
      category: expenseData?.category ?? "",
      value: expenseData?.value ?? 0,
      date: expenseData
        ? formatDateForInput(expenseData.date)
        : formatDateForInput(new Date()),
    },
  });

  useEffect(() => {
    if (isEditing) {
      if (expenseData) {
        form.reset({
          description: expenseData.description,
          category: expenseData.category ?? "",
          value: expenseData.value,
          date: formatDateForInput(expenseData.date),
        });
      }
    } else {
      form.reset({
        description: "",
        category: "",
        value: 0,
        date: formatDateForInput(new Date()),
      });
    }
  }, [isEditing, expenseData, form]);

  async function onSubmit(values: ExpenseFormValues) {
    const apiUrl = isEditing
      ? `/api/expenses/${expenseData?.id}`
      : "/api/expenses";
    const method = isEditing ? "PUT" : "POST";

    const dataToSend = {
      ...values,
      value: Number(values.value),
      category: values.category?.trim() === "" ? null : values.category?.trim(),
    };

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
            `Falha ao ${isEditing ? "atualizar" : "salvar"} despesa`
        );
      }

      onSaveSuccess();
    } catch (error) {
      console.error("Erro no formulário de despesa:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro desconhecido.";
      toast.error("Erro ao salvar despesa", { description: errorMsg });
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
                  placeholder='Ex: Conta de Luz'
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
          name='category'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria (Opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder='Ex: Contas Fixas, Manutenção'
                  {...field}
                  value={field.value ?? ""}
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
              : "Adicionar Despesa"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

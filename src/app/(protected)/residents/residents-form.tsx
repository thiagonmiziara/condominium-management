/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { UserRole } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";

const formSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  apartment: z.string().min(1, { message: "Apartamento é obrigatório." }),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Selecione uma função válida." }),
  }),
});

type ResidentFormValues = z.infer<typeof formSchema>;

interface ResidentData {
  id: string;
  name: string | null;
  email: string | null;
  apartment: string | null;
  role: UserRole;
  isActive: boolean;
}

interface ResidentFormProps {
  residentData?: ResidentData | null;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export default function ResidentForm({
  residentData,
  onSaveSuccess,
  onCancel,
}: ResidentFormProps) {
  const { data: session } = useSession();
  const isEditing = !!residentData;
  const isEditingSelf = isEditing && session?.user?.id === residentData?.id;

  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      name: "",
      apartment: "",
      role: UserRole.MORADOR,
    },
  });

  useEffect(() => {
    if (isEditing && residentData) {
      form.reset({
        name: residentData.name ?? "",
        apartment: residentData.apartment ?? "",
        role: residentData.role,
      });
    } else {
      // Limpa/reseta para valores padrão ao adicionar
      form.reset({
        name: "",
        apartment: "",
        role: UserRole.MORADOR,
      });
    }
  }, [isEditing, residentData, form]);

  async function onSubmit(values: ResidentFormValues) {
    const apiUrl = isEditing
      ? `/api/residents/${residentData?.id}`
      : "/api/residents";
    const method = isEditing ? "PUT" : "POST";

    let dataToSend: any;

    if (isEditing) {
      dataToSend = values;
    } else {
      const emailValue = (
        document.getElementById("email-add-resident") as HTMLInputElement
      )?.value;
      if (!emailValue || !z.string().email().safeParse(emailValue).success) {
        toast.error("Erro de Validação", {
          description: "Por favor, insira um email válido para cadastrar.",
        });
        return;
      }

      dataToSend = { ...values, email: emailValue };
    }

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
            `Falha ao ${isEditing ? "atualizar" : "cadastrar"} usuário`
        );
      }

      toast.success(
        `Usuário ${isEditing ? "atualizado" : "cadastrado"} com sucesso!`
      );
      onSaveSuccess();
    } catch (error) {
      console.error("Erro no formulário de usuário:", error);
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro desconhecido.";
      toast.error(`Erro ao ${isEditing ? "atualizar" : "cadastrar"}`, {
        description: errorMsg,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input
                  placeholder='Nome do Usuário'
                  {...field}
                  disabled={form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              id='email-add-resident'
              type='email'
              placeholder='email@exemplo.com'
              defaultValue={isEditing ? residentData?.email ?? "" : ""}
              disabled={isEditing || form.formState.isSubmitting}
              required={!isEditing}
            />
          </FormControl>

          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name='apartment'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Apartamento</FormLabel>
              <FormControl>
                <Input
                  placeholder='Ex: 101, Bloco A Apto 202'
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
          name='role'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isEditingSelf || form.formState.isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Selecione a função' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={UserRole.MORADOR}>Morador</SelectItem>
                  <SelectItem value={UserRole.SINDICO}>Síndico</SelectItem>
                </SelectContent>
              </Select>

              {isEditingSelf && (
                <p className='text-xs text-muted-foreground pt-1'>
                  Você não pode alterar sua própria função.
                </p>
              )}
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
              : "Cadastrar Morador"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

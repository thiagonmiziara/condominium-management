import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

interface ExpenseParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: ExpenseParams) {
  // Nome padrão GET para a rota de ID
  // Lógica para buscar uma despesa pelo ID (acessível a todos logados)
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const { id } = params;
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(expense);
  } catch (error) {
    console.error("Erro ao buscar despesa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: ExpenseParams) {
  // Nome padrão PUT para a rota de ID
  // Lógica para atualizar uma despesa pelo ID (acessível apenas pelo SINDICO)
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { id } = params;
    const data = await request.json();
    // TODO: Adicionar validação de dados (ex: com Zod)
    if (!data.description || !data.value || !data.date) {
      // Categoria é opcional
      return NextResponse.json(
        {
          error: "Dados incompletos (Descrição, Valor, Data são obrigatórios)",
        },
        { status: 400 }
      );
    }
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        description: data.description,
        value: parseFloat(data.value),
        date: new Date(data.date),
        category: data.category, // Atualiza categoria
      },
    });
    return NextResponse.json(updatedExpense);
  } catch (error) {
    // TODO: Tratar erro caso ID não exista (P2025)
    console.error("Erro ao atualizar despesa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: ExpenseParams) {
  // Nome padrão DELETE para a rota de ID
  // Lógica para deletar uma despesa pelo ID (acessível apenas pelo SINDICO)
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { id } = params;
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json(
      { message: "Despesa deletada com sucesso" },
      { status: 200 }
    );
    // Ou retornar status 204 No Content: return new NextResponse(null, { status: 204 });
  } catch (error) {
    // TODO: Tratar erro caso ID não exista (P2025)
    console.error("Erro ao deletar despesa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

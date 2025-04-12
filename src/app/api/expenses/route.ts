import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Nome padrão GET para a rota base
  // Lógica para buscar todas as despesas (acessível a todos logados)
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Erro ao buscar despesas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Nome padrão POST para a rota base
  // Lógica para criar uma nova despesa (acessível apenas pelo SINDICO)
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
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
    const newExpense = await prisma.expense.create({
      data: {
        description: data.description,
        value: parseFloat(data.value),
        date: new Date(data.date),
        category: data.category, // Inclui categoria se fornecida
      },
    });
    return NextResponse.json(newExpense, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar despesa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

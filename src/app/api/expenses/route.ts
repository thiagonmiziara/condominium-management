import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const whereClause: Prisma.ExpenseWhereInput = {};

  if (startDateParam || endDateParam) {
    whereClause.date = {};
    if (startDateParam) {
      whereClause.date.gte = new Date(startDateParam);
    }
    if (endDateParam) {
      whereClause.date.lte = new Date(endDateParam);
    }
  }

  try {
    const expenses = await prisma.expense.findMany({
      where: whereClause,
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

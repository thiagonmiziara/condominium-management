import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { UserRole, Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth-options";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const whereClause: Prisma.RevenueWhereInput = {};

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
    const revenues = await prisma.revenue.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
    });
    return NextResponse.json(revenues);
  } catch (error) {
    console.error("Erro ao buscar receitas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST: Criar nova receita (acessível apenas pelo SINDICO)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const data = await request.json();
    // TODO: Adicionar validação de dados (ex: com Zod)
    if (!data.description || !data.value || !data.date) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }
    const newRevenue = await prisma.revenue.create({
      data: {
        description: data.description,
        value: parseFloat(data.value),
        date: new Date(data.date),
      },
    });
    return NextResponse.json(newRevenue, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar receita:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

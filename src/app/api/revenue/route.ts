import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Seu singleton do Prisma Client
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Suas opções do NextAuth
import { UserRole } from "@prisma/client"; // Enum de Roles

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const revenues = await prisma.revenue.findMany({
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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Seu singleton do Prisma Client
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Suas opções do NextAuth
import { UserRole } from "@prisma/client"; // Enum de Roles

interface RevenueParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RevenueParams) {
  // Lógica para buscar uma receita pelo ID (acessível a todos logados)
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const { id } = params;
    const revenue = await prisma.revenue.findUnique({ where: { id } });
    if (!revenue) {
      return NextResponse.json(
        { error: "Receita não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(revenue);
  } catch (error) {
    console.error("Erro ao buscar receita:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RevenueParams) {
  // Lógica para atualizar uma receita pelo ID (acessível apenas pelo SINDICO)
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { id } = params;
    const data = await request.json();
    // TODO: Adicionar validação de dados (ex: com Zod)
    const updatedRevenue = await prisma.revenue.update({
      where: { id },
      data: {
        description: data.description,
        value: parseFloat(data.value),
        date: new Date(data.date),
      },
    });
    return NextResponse.json(updatedRevenue);
  } catch (error) {
    // TODO: Tratar erro caso ID não exista (P2025)
    console.error("Erro ao atualizar receita:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RevenueParams) {
  // Lógica para deletar uma receita pelo ID (acessível apenas pelo SINDICO)
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { id } = params;
    await prisma.revenue.delete({ where: { id } });
    return NextResponse.json(
      { message: "Receita deletada com sucesso" },
      { status: 200 }
    );
    // Ou retornar status 204 No Content: return new NextResponse(null, { status: 204 });
  } catch (error) {
    // TODO: Tratar erro caso ID não exista (P2025)
    console.error("Erro ao deletar receita:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

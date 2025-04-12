/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth-options";

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const { id } = context.params;
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

// PUT
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = context.params;
    const data = await request.json();

    if (!data.description || data.value === undefined || !data.date) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    if (typeof data.value !== "number" || data.value < 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        description: data.description,
        value: data.value,
        date: new Date(data.date),
        category: data.category,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { id } = context.params;
    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ message: "Despesa deletada com sucesso" });
  } catch (error) {
    if ((error as any)?.code === "P2025") {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

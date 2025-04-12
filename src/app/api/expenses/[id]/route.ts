/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

type Params = { params: { id: string } };

// GET
export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    });
    if (!expense) {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(expense);
  } catch (erro) {
    if (erro instanceof Error) {
      return NextResponse.json({ error: erro.message }, { status: 500 });
    }
  }
}

// PUT
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const data = await request.json();

    if (!data.description || data.value === undefined || !data.date) {
      return NextResponse.json(
        { error: "Descrição, valor e data são obrigatórios" },
        { status: 400 }
      );
    }

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: {
        description: data.description,
        value: data.value,
        date: new Date(data.date),
        category: data.category,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    await prisma.expense.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Despesa deletada com sucesso" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Despesa não encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

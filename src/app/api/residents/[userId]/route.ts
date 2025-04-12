/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  // Apenas SINDICO pode buscar dados de outros usuários por ID
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { userId } = params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        apartment: true,
        role: true,
        isActive: true,
      }, // Não retorna senha ou dados sensíveis
    });
    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT: Atualizar dados do usuário (nome, apartamento, role)
export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  // Apenas SINDICO pode editar outros usuários
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { userId } = params;
    const data = await request.json();

    // ** Segurança: Impedir que síndico altere o próprio email ou role por esta rota? **
    // if (session.user.id === userId && data.role !== undefined && data.role !== session.user.role) {
    //     return NextResponse.json({ error: 'Você não pode alterar sua própria função.' }, { status: 403 });
    // }
    if (
      session.user.id === userId &&
      data.role &&
      data.role !== UserRole.SINDICO
    ) {
      return NextResponse.json(
        { error: "Síndico não pode rebaixar a si mesmo." },
        { status: 403 }
      );
    }

    // TODO: Adicionar validação mais robusta com Zod
    // Valida campos obrigatórios se presentes
    if (data.name !== undefined && !data.name)
      return NextResponse.json(
        { error: "Nome não pode ser vazio" },
        { status: 400 }
      );
    if (data.apartment !== undefined && !data.apartment)
      return NextResponse.json(
        { error: "Apartamento não pode ser vazio" },
        { status: 400 }
      );
    if (
      data.role !== undefined &&
      !Object.values(UserRole).includes(data.role)
    ) {
      return NextResponse.json(
        { error: "Função (role) inválida" },
        { status: 400 }
      );
    }

    // Monta o objeto de dados para atualização apenas com os campos fornecidos
    const dataToUpdate: { name?: string; apartment?: string; role?: UserRole } =
      {};
    if (data.name !== undefined) dataToUpdate.name = data.name;
    if (data.apartment !== undefined) dataToUpdate.apartment = data.apartment;
    if (data.role !== undefined) dataToUpdate.role = data.role;

    // Verifica se há dados para atualizar
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado fornecido para atualização" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
        // Garante que só edita MORADOR ou SINDICO (opcional, pode remover se houver outras roles)
        role: { in: [UserRole.MORADOR, UserRole.SINDICO] },
      },
      data: dataToUpdate, // Atualiza apenas os campos fornecidos
      select: {
        id: true,
        name: true,
        email: true,
        apartment: true,
        role: true,
        isActive: true,
      }, // Retorna dados atualizados
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    // TODO: Tratar erro caso ID não exista (P2025)
    console.error("Erro ao atualizar usuário:", error);
    // Tratar erro P2025 (Record to update not found)
    if ((error as any)?.code === "P2025") {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inválido para atualização" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH: Desativar morador OU síndico (exceto a si mesmo)
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { userId } = params;
    // Impede síndico de desativar a si mesmo
    if (session.user.id === userId) {
      return NextResponse.json(
        { error: "Você não pode desativar a si mesmo." },
        { status: 400 }
      );
    }
    // Permite desativar MORADOR ou outro SINDICO
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
        role: { in: [UserRole.MORADOR, UserRole.SINDICO] },
      },
      data: { isActive: false }, // Define o usuário como inativo
      select: { id: true, name: true, isActive: true, role: true }, // Retorna dados confirmando
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    // Tratar erro caso ID não exista ou não seja MORADOR/SINDICO (P2025)
    console.error("Erro ao desativar usuário:", error);
    if ((error as any)?.code === "P2025") {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inválido para desativação" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

// GET: Listar moradores e síndicos ativos
export async function GET() {
  const session = await getServerSession(authOptions);
  // Apenas SINDICO pode listar todos os usuários (moradores e outros síndicos)
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const users = await prisma.user.findMany({
      // Busca MORADOR ou SINDICO que estejam ativos
      where: {
        isActive: true, // Apenas ativos
        role: {
          in: [UserRole.MORADOR, UserRole.SINDICO], // Inclui ambos os papéis
        },
      },
      // Seleciona os campos a serem retornados
      select: {
        id: true,
        name: true,
        email: true,
        apartment: true,
        role: true,
        isActive: true,
      },
      orderBy: [
        { role: "asc" }, // Opcional: Ordena por role
        { name: "asc" }, // Depois por nome
      ],
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários (moradores/síndicos):", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST: Criar/cadastrar um novo morador
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  // Apenas SINDICO pode cadastrar
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const data = await request.json();

    // TODO: Adicionar validação mais robusta com Zod
    if (!data.email || !data.name || !data.apartment) {
      return NextResponse.json(
        {
          error:
            "Dados incompletos (Nome, Email, Apartamento são obrigatórios)",
        },
        { status: 400 }
      );
    }
    // Valida a role recebida (se enviada, senão assume MORADOR)
    const roleToSet =
      data.role && Object.values(UserRole).includes(data.role)
        ? data.role
        : UserRole.MORADOR;
    // Impede criação direta de SINDICO se houver regra de negócio contra isso
    // if (roleToSet === UserRole.SINDICO) { /* adicionar lógica se necessário */ }

    // Verifica se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      ); // 409 Conflict
    }

    // Cria o novo usuário com role MORADOR (ou a role enviada, se válida) e ativo por padrão
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        apartment: data.apartment,
        role: roleToSet, // Define a role (padrão MORADOR)
        isActive: true, // Define como ativo por padrão
      },
      // Retorna os dados relevantes do usuário criado
      select: {
        id: true,
        name: true,
        email: true,
        apartment: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    // Trata erro específico de constraint única (email)
    if (
      (error as any)?.code === "P2002" &&
      (error as any)?.meta?.target?.includes("email")
    ) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }
    // Retorna erro genérico para outros casos
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

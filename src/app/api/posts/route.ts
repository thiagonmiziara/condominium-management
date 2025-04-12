// ----- Arquivo: src/app/api/posts/route.ts -----

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserRole } from "@prisma/client";

// GET: Listar todos os posts (acessível a todos logados)
export async function GET() {
  // <--- Verifique se o nome é exatamente GET
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } }, // Inclui nome do autor
    });
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST: Criar novo post (acessível apenas pelo SINDICO)
export async function POST(request: Request) {
  // <--- Verifique se o nome é exatamente POST
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const data = await request.json();
    // TODO: Adicionar validação de dados (ex: com Zod)
    if (!data.title || !data.content) {
      return NextResponse.json(
        { error: "Título e conteúdo são obrigatórios" },
        { status: 400 }
      );
    }
    const newPost = await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: session.user.id, // ID do síndico logado
      },
    });
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar post:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

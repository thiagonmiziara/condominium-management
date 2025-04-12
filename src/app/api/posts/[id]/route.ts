import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth-options";

interface PostParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: PostParams) {
  // Nome padrão GET para a rota de ID
  // Lógica para buscar um post pelo ID (acessível a todos logados)
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { author: { select: { name: true } } }, // Inclui nome do autor
    });
    if (!post) {
      return NextResponse.json(
        { error: "Post não encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error("Erro ao buscar post:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: PostParams) {
  // Nome padrão PUT para a rota de ID
  // Lógica para atualizar um post pelo ID (acessível apenas pelo SINDICO)
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const data = await request.json();
    // TODO: Adicionar validação de dados (ex: com Zod)
    if (!data.title || !data.content) {
      return NextResponse.json(
        { error: "Título e conteúdo são obrigatórios" },
        { status: 400 }
      );
    }

    // Opcional: Verificar se o síndico logado é o autor do post antes de permitir a edição
    // const post = await prisma.post.findUnique({ where: { id } });
    // if (post?.authorId !== session.user.id) {
    //    return NextResponse.json({ error: 'Acesso negado: você não é o autor deste post' }, { status: 403 });
    // }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        // authorId não deve ser alterado aqui
      },
    });
    return NextResponse.json(updatedPost);
  } catch (error) {
    // TODO: Tratar erro caso ID não exista (P2025)
    console.error("Erro ao atualizar post:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: PostParams) {
  // Nome padrão DELETE para a rota de ID
  // Lógica para deletar um post pelo ID (acessível apenas pelo SINDICO)
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  try {
    const { id } = await params;

    // Opcional: Verificar se o síndico logado é o autor do post antes de permitir a exclusão
    // const post = await prisma.post.findUnique({ where: { id } });
    // if (post?.authorId !== session.user.id) {
    //    return NextResponse.json({ error: 'Acesso negado: você não é o autor deste post' }, { status: 403 });
    // }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json(
      { message: "Post deletado com sucesso" },
      { status: 200 }
    );
    // Ou retornar status 204 No Content: return new NextResponse(null, { status: 204 });
  } catch (error) {
    // TODO: Tratar erro caso ID não exista (P2025)
    console.error("Erro ao deletar post:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

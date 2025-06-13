import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@prisma/client";
import { getDashboardData } from "@/lib/dashboard-data";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== UserRole.SINDICO) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  if (startDateParam) {
    startDate = new Date(startDateParam);
  }
  if (endDateParam) {
    endDate = new Date(endDateParam);
  }

  try {
    const data = await getDashboardData({ startDate, endDate });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

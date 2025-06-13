import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface DashboardDataParams {
  startDate?: Date;
  endDate?: Date;
}

export async function getDashboardData({
  startDate,
  endDate,
}: DashboardDataParams = {}) {
  const dateFilter: Prisma.DateTimeFilter = {};

  if (startDate) {
    dateFilter.gte = startDate;
  }
  if (endDate) {
    dateFilter.lte = endDate;
  }

  const revenueWhereClause: Prisma.RevenueWhereInput = {};
  const expenseWhereClause: Prisma.ExpenseWhereInput = {};

  if (startDate || endDate) {
    revenueWhereClause.date = dateFilter;
    expenseWhereClause.date = dateFilter;
  }

  try {
    const totalRevenuePromise = prisma.revenue.aggregate({
      _sum: { value: true },
      where: revenueWhereClause,
    });
    const totalExpensesPromise = prisma.expense.aggregate({
      _sum: { value: true },
      where: expenseWhereClause,
    });
    const expensesByCategoryPromise = prisma.expense.groupBy({
      by: ["category"],
      _sum: { value: true },
      where: expenseWhereClause,
      orderBy: { _sum: { value: "desc" } },
      take: 5,
    });
    const allRevenuePromise = prisma.revenue.findMany({
      select: { date: true, value: true },
      where: revenueWhereClause,
      orderBy: { date: "asc" },
    });
    const allExpensesPromise = prisma.expense.findMany({
      select: { date: true, value: true },
      where: expenseWhereClause,
      orderBy: { date: "asc" },
    });

    const [
      totalRevenueResult,
      totalExpensesResult,
      expensesByCategoryRaw,
      allRevenue,
      allExpenses,
    ] = await Promise.all([
      totalRevenuePromise,
      totalExpensesPromise,
      expensesByCategoryPromise,
      allRevenuePromise,
      allExpensesPromise,
    ]);

    const categoryColors = [
      "#ef4444",
      "#f97316",
      "#f43f5e",
      "#dc2626",
      "#ea580c",
    ];

    const expensesByCategory = expensesByCategoryRaw.map((item, index) => ({
      name: item.category ?? "Outras",
      value: item._sum.value ?? 0,
      fill: categoryColors[index % categoryColors.length],
    }));

    const monthlyMap: { [key: string]: { Receita: number; Despesa: number } } =
      {};
    const processEntries = (
      entries: { date: Date; value: number }[],
      type: "Receita" | "Despesa"
    ) => {
      entries.forEach((entry) => {
        const monthYear = entry.date.toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
          timeZone: "UTC",
        });
        if (!monthlyMap[monthYear]) {
          monthlyMap[monthYear] = { Receita: 0, Despesa: 0 };
        }
        monthlyMap[monthYear][type] += entry.value;
      });
    };
    processEntries(allRevenue, "Receita");
    processEntries(allExpenses, "Despesa");

    const monthlyData = Object.entries(monthlyMap)
      .map(([month, values]) => ({ month, ...values }))
      .sort((a, b) => {
        // Ordena por mês/ano para garantir a ordem cronológica
        const [monthA, yearA] = a.month.split(" ");
        const [monthB, yearB] = b.month.split(" ");

        const dateA = new Date(`01 ${monthA} ${yearA}`);
        const dateB = new Date(`01 ${monthB} ${yearB}`);

        return dateA.getTime() - dateB.getTime();
      });

    return {
      revenue: totalRevenueResult._sum.value || 0,
      expenses: totalExpensesResult._sum.value || 0,
      balance:
        (totalRevenueResult._sum.value || 0) -
        (totalExpensesResult._sum.value || 0),
      expensesByCategory,
      monthlyData,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return {
      revenue: 0,
      expenses: 0,
      balance: 0,
      expensesByCategory: [],
      monthlyData: [],
      error: "Não foi possível carregar os dados do dashboard.",
    };
  }
}

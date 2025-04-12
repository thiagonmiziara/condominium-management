import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardClient from "./dashboard-client"; // Componente cliente para gráficos/interação
import { prisma } from "@/lib/prisma";
import { formatCurrency, cn } from "@/lib/utils"; // Importa cn também
import { CircleDollarSign, CreditCard, Activity } from "lucide-react"; // Icons

async function getDashboardData() {
  try {
    const totalRevenuePromise = prisma.revenue.aggregate({
      _sum: { value: true },
    });
    const totalExpensesPromise = prisma.expense.aggregate({
      _sum: { value: true },
    });
    const expensesByCategoryPromise = prisma.expense.groupBy({
      by: ["category"],
      _sum: { value: true },
      orderBy: { _sum: { value: "desc" } },
      take: 5,
    });
    const allRevenuePromise = prisma.revenue.findMany({
      select: { date: true, value: true },
      orderBy: { date: "asc" },
    });
    const allExpensesPromise = prisma.expense.findMany({
      select: { date: true, value: true },
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
      .sort(() => {
        return 0;
      });

    return {
      revenue: totalRevenueResult._sum.value ?? 0,
      expenses: totalExpensesResult._sum.value ?? 0,
      balance:
        (totalRevenueResult._sum.value ?? 0) -
        (totalExpensesResult._sum.value ?? 0),
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

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (data.error) {
    return <div className='text-red-500 p-4 font-medium'>{data.error}</div>;
  }

  const isBalancePositive = data.balance >= 0;

  return (
    <div className='space-y-8'>
      <h2 className='text-3xl font-bold tracking-tight text-cyan-400'>
        Dashboard
      </h2>

      <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-l-4 border-green-600 bg-zinc-900'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-zinc-300'>
              Receita Total
            </CardTitle>
            <CircleDollarSign className='h-4 w-4 text-zinc-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-zinc-100'>
              {formatCurrency(data.revenue)}
            </div>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-red-600 bg-zinc-900'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-zinc-300'>
              Despesa Total
            </CardTitle>
            <CreditCard className='h-4 w-4 text-zinc-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-zinc-100'>
              {formatCurrency(data.expenses)}
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "border-l-4 bg-zinc-900",
            isBalancePositive ? "border-cyan-500" : "border-red-600"
          )}
        >
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-zinc-300'>
              Saldo
            </CardTitle>
            <Activity className='h-4 w-4 text-zinc-500' />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                isBalancePositive ? "text-cyan-400" : "text-red-500"
              )}
            >
              {formatCurrency(data.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 grid-cols-1 lg:grid-cols-2'>
        <DashboardClient
          expensesByCategory={data.expensesByCategory}
          monthlyData={data.monthlyData}
        />
      </div>
    </div>
  );
}

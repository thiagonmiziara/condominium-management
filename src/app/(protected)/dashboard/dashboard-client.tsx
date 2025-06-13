"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/date-range-picker";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CircleDollarSign, CreditCard, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryData {
  name: string;
  value: number;
  fill: string;
}
interface MonthlyData {
  month: string;
  Receita: number;
  Despesa: number;
}

interface DashboardData {
  revenue: number;
  expenses: number;
  balance: number;
  expensesByCategory: CategoryData[];
  monthlyData: MonthlyData[];
  error?: string;
}

interface DashboardClientProps {
  initialData: DashboardData;
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(initialData);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);
    return {
      from: startOfCurrentMonth,
      to: endOfCurrentMonth,
    };
  });

  const fetchDashboardData = useCallback(async (range?: DateRange) => {
    setIsLoadingData(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (range?.from) {
        params.append("startDate", range.from.toISOString());
      }
      if (range?.to) {
        params.append("endDate", range.to.toISOString());
      }
      const queryString = params.toString();
      const response = await fetch(
        `/api/dashboard-data${queryString ? `?${queryString}` : ""}`
      );
      if (!response.ok) throw new Error("Failed to fetch dashboard data");
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setFetchError(errorMsg);
      toast.error("Error fetching dashboard data", { description: errorMsg });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchDashboardData(dateRange);
  }, [dateRange, fetchDashboardData]);

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };

  const barColors = {
    receita: "#22c55e",
    despesa: "#ef4444",
  };

  const axisColor = "#a1a1aa";
  const gridColor = "rgba(63, 63, 70, 0.5)";

  const pieChartData = dashboardData.expensesByCategory;
  const monthlyData = dashboardData.monthlyData;

  if (fetchError) {
    return (
      <div className='bg-destructive/10 border border-destructive/50 text-destructive p-4 rounded-md text-center col-span-full'>
        <p>Error: {fetchError}</p>
        <button
          onClick={() => fetchDashboardData(dateRange)}
          className='mt-2 px-4 py-2 bg-destructive text-destructive-foreground rounded'
        >
          Try Again
        </button>
      </div>
    );
  }

  const isBalancePositive = dashboardData.balance >= 0;

  return (
    <div className='grid gap-6 grid-cols-1 lg:grid-cols-2'>
      <div className='col-span-full flex justify-end'>
        <DateRangePicker
          onDateChange={handleDateChange}
          initialDateRange={dateRange}
        />
      </div>

      {isLoadingData ? (
        <div className='col-span-full text-center py-10'>
          <Loader2 className='h-8 w-8 animate-spin text-cyan-400 mx-auto' />
          <p className='text-zinc-400 mt-2'>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 col-span-full'>
            <Card className='border-l-4 border-green-600 bg-zinc-900'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-zinc-300'>
                  Receita Total
                </CardTitle>
                <CircleDollarSign className='h-4 w-4 text-zinc-500' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-zinc-100'>
                  {formatCurrency(dashboardData.revenue)}
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
                  {formatCurrency(dashboardData.expenses)}
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
                  {formatCurrency(dashboardData.balance)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className='lg:col-span-1 bg-zinc-800 border-zinc-700'>
            <CardHeader>
              <CardTitle className='text-base font-semibold text-cyan-400'>
                Receita vs Despesa Mensal
              </CardTitle>
              <CardDescription className='text-xs text-zinc-500'>
                Comparativo Mês a Mês
              </CardDescription>
            </CardHeader>
            <CardContent className='pl-2 pr-4'>
              <ChartContainer config={{}} className='h-[300px] w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke={gridColor}
                      vertical={false}
                    />
                    <XAxis
                      dataKey='month'
                      stroke={axisColor}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={axisColor}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(Number(value))}
                      width={85}
                    />
                    <ChartTooltip
                      cursor={{ fill: "hsl(240 3.7% 15.9% / 0.3)" }}
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                          className='bg-zinc-900/90 border-zinc-700 text-zinc-200 backdrop-blur-sm'
                        />
                      }
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(value) => (
                        <span style={{ color: axisColor }}>{value}</span>
                      )}
                    />

                    <Bar
                      dataKey='Receita'
                      fill={barColors.receita}
                      radius={[4, 4, 0, 0]}
                      name='Receita'
                    />
                    <Bar
                      dataKey='Despesa'
                      fill={barColors.despesa}
                      radius={[4, 4, 0, 0]}
                      name='Despesa'
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className='lg:col-span-1 flex flex-col bg-zinc-800 border-zinc-700'>
            <CardHeader className='items-center pb-0'>
              <CardTitle className='text-base font-semibold text-cyan-400'>
                Despesas por Categoria
              </CardTitle>
              <CardDescription className='text-xs text-zinc-500'>
                Distribuição das 5 maiores
              </CardDescription>
            </CardHeader>
            <CardContent className='flex-1 pb-0'>
              <ChartContainer
                config={{}}
                className='mx-auto aspect-square max-h-[280px]'
              >
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          nameKey='name'
                          formatter={(value) => formatCurrency(Number(value))}
                          className='bg-zinc-900/90 border-zinc-700 text-zinc-200 backdrop-blur-sm'
                        />
                      }
                    />
                    <Pie
                      data={pieChartData}
                      dataKey='value'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      innerRadius={70}
                      outerRadius={110}
                      strokeWidth={3}
                      stroke={"#18181b"}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          name={entry.name}
                        />
                      ))}
                    </Pie>
                    <Legend
                      wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
            <CardFooter className='flex-col gap-2 text-sm pt-4'>
              <div className='leading-none text-muted-foreground'>
                Mostrando as 5 maiores categorias de despesa.
              </div>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

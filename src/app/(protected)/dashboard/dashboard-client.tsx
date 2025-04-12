"use client";

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

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
interface DashboardClientProps {
  expensesByCategory: CategoryData[];
  monthlyData: MonthlyData[];
}

export default function DashboardClient({
  expensesByCategory,
  monthlyData,
}: DashboardClientProps) {
  const barColors = {
    receita: "#22c55e",
    despesa: "#ef4444",
  };

  const axisColor = "#a1a1aa";
  const gridColor = "rgba(63, 63, 70, 0.5)";

  const pieChartData = expensesByCategory;

  return (
    <>
      {/* Gráfico de BARRAS (Receita x Despesa Mensal) com cores explícitas */}
      <Card className='lg:col-span-1 bg-zinc-900 border-zinc-800'>
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
              {/* Substitui LineChart por BarChart */}
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
                {/* Barras com cores explícitas e cantos arredondados */}
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

      {/* Gráfico de Donut (Despesas por Categoria) com cores explícitas (tons de vermelho) */}
      <Card className='lg:col-span-1 flex flex-col bg-zinc-900 border-zinc-800'>
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
                  {/* Usa as cores explícitas (tons de vermelho) passadas via 'fill' */}
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
  );
}

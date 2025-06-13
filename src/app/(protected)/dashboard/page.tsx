import DashboardClient from "./dashboard-client";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { UserRole } from "@prisma/client";
import { getDashboardData } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== UserRole.SINDICO) {
    redirect("/bulletin");
  }

  const today = new Date();
  const startOfCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );
  const endOfCurrentMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  );

  const data = await getDashboardData({
    startDate: startOfCurrentMonth,
    endDate: endOfCurrentMonth,
  });

  if (data.error) {
    return <div className='text-red-500 p-4 font-medium'>{data.error}</div>;
  }

  return (
    <div className='space-y-8'>
      <h2 className='text-3xl font-bold tracking-tight text-cyan-400'>
        Dashboard
      </h2>

      <DashboardClient initialData={data} />
    </div>
  );
}

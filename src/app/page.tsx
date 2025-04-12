import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard"); // Vai para o dashboard se logado
  } else {
    redirect("/signin"); // Vai para o login se não logado
  }
}

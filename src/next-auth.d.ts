/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import { UserRole } from "@prisma/client"; // Importe o Enum do Prisma

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// --- Definições de Tipo para NextAuth ---
// (Idealmente em um arquivo next-auth.d.ts na raiz ou src/)

declare module "next-auth" {
  // Estende a interface User base (usada internamente, ex: parâmetro 'user' do callback jwt)
  // Adicione aqui apenas os campos que o SEU adapter/provider retorna ALÉM dos padrões
  interface User {
    // id, name, email, image já são esperados por DefaultUser/AdapterUser
    role?: UserRole; // Role pode não vir diretamente do provider/adapter inicial
    isActive?: boolean;
  }

  // Estende a interface Session (o que fica disponível via useSession/getServerSession)
  interface Session {
    user: {
      // Define explicitamente a estrutura esperada para session.user
      id: string; // Obrigatório (adicionado pelo callback)
      role: UserRole; // Obrigatório (adicionado pelo callback)
      isActive?: boolean; // Opcional (se adicionado pelo callback)
      // Inclui os campos padrão do DefaultSession["user"] explicitamente
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }; // Remove a interseção '& DefaultSession["user"]' que pode causar conflito
  }
}

declare module "next-auth/jwt" {
  // Estende o token JWT com os campos customizados que você adiciona
  interface JWT {
    id?: string;
    role?: UserRole;
    isActive?: boolean;
    // Adicione outros campos que você possa colocar no token (name, picture, etc.)
    name?: string | null;
    picture?: string | null; // 'picture' é o nome comum no JWT para 'image'
  }
}

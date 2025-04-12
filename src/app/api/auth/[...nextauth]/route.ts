import NextAuth, { type NextAuthOptions } from "next-auth"; // Import DefaultSession
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // Configura o provedor de Email
  providers: [
    EmailProvider({
      // Pega as configurações do servidor e remetente do .env
      server: process.env.EMAIL_SERVER, // Ex: smtp://resend:API_KEY@smtp.resend.com:587
      from: process.env.EMAIL_FROM, // Ex: voce@seudominioverificado.com

      // --- Função customizada para enviar o email de verificação ---
      async sendVerificationRequest({ identifier: email, url, provider }) {
        console.log(`[Auth] Recebida requisição de verificação para: ${email}`); // Log para debug

        // 1. Verifica se o usuário existe e está ATIVO no banco
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, isActive: true }, // Verifica se existe e se está ativo
        });

        // 2. BLOQUEIA se o usuário não existe ou está INATIVO
        if (!user || !user.isActive) {
          console.warn(
            `[Auth] Tentativa de login bloqueada (não cadastrado ou inativo): ${email}`
          );
          // Lança um erro que pode ser tratado no frontend (na página de signin, via searchParams)
          throw new Error("VerificationEmailNotSent"); // Erro genérico para não vazar informação
        }

        // 3. Se usuário OK, envia o email usando nodemailer e as configs do provider
        console.log(
          `[Auth] Usuário ${email} encontrado e ativo. Enviando link mágico...`
        );
        const { host } = new URL(url);
        const transport = nodemailer.createTransport(provider.server); // Cria o transportador
        const result = await transport.sendMail({
          to: email,
          from: provider.from,
          subject: `Link de acesso para Gestão Condomínio`, // Assunto do email
          text: `Use este link para entrar: ${url}\n`, // Corpo em texto puro
          // Corpo em HTML (mais amigável)
          html: `
            <div style="font-family: sans-serif; padding: 20px; background-color: #f4f4f4;">
              <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333;">Olá!</h2>
                <p style="color: #555; line-height: 1.6;">
                  Clique no botão abaixo para acessar sua conta no sistema de Gestão de Condomínio:
                </p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Acessar Sistema
                  </a>
                </p>
                <p style="color: #555; line-height: 1.6;">
                  Se você não solicitou este email, pode ignorá-lo com segurança. Este link expirará em breve.
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 0.9em; color: #888;">Enviado por Gestão Condomínio (${host})</p>
              </div>
            </div>
          `,
        });

        // Verifica se houve falha no envio
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          console.error(
            `[Auth] Falha ao enviar email para: ${failed.join(", ")}`
          );
          throw new Error(`Falha no envio do email para ${failed.join(", ")}`);
        }

        console.log(`[Auth] Link mágico enviado com sucesso para: ${email}`);
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Adiciona ID, Role e Status ao token JWT
    async jwt({ token, user }) {
      // No login inicial (quando 'user' existe - vindo do adapter)
      if (user) {
        token.id = user.id;
        // Busca role e isActive do banco ao logar
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email ?? undefined },
          select: { role: true, isActive: true },
        });
        // Adiciona ao token SOMENTE se o usuário estiver ativo
        if (dbUser?.isActive) {
          token.role = dbUser.role || UserRole.MORADOR;
          token.isActive = dbUser.isActive;
        } else {
          return {}; // Invalida token se inativo
        }
      }

      // Garante que apenas tokens de usuários ativos continuem válidos
      if (!token.isActive) {
        return {};
      }

      return token;
    },

    // Adiciona ID e Role do token para o objeto 'session' do cliente
    async session({ session, token }) {
      // Adiciona os dados customizados do token à sessão, se existirem e isActive for true
      if (
        token?.id &&
        token?.role &&
        token?.isActive === true &&
        session.user
      ) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {} as any; // Força uma sessão inválida
      }
      return session;
    },
  },

  // Secret para JWT (essencial em produção)
  secret: process.env.NEXTAUTH_SECRET,

  // Habilita logs de debug em desenvolvimento
  debug: process.env.NODE_ENV === "development",
};

// Exporta os handlers
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

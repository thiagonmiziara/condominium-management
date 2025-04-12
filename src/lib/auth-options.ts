/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { UserRole } from "@prisma/client"; // Importa UserRole
import nodemailer from "nodemailer"; // Importa nodemailer
import { prisma } from "@/lib/prisma"; // Importa o singleton do Prisma

// Definição e EXPORTAÇÃO do objeto authOptions
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        // Log inicial
        console.log(`[Auth] Recebida requisição de verificação para: ${email}`);

        // Verifica se usuário existe e está ativo
        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, isActive: true },
        });
        console.log(`[Auth] Usuário encontrado no DB para ${email}:`, user); // Debug DB check

        // Bloqueia se não existe ou inativo
        if (!user || !user.isActive) {
          console.warn(
            `[Auth] Tentativa de login bloqueada (não cadastrado ou inativo): ${email}`
          );
          throw new Error("VerificationEmailNotSent"); // Erro para NextAuth tratar
        }

        // Envia email se usuário OK
        console.log(
          `[Auth] Usuário ${email} encontrado e ativo. Enviando link mágico...`
        );
        const { host } = new URL(url);
        const transport = nodemailer.createTransport(provider.server);
        try {
          const result = await transport.sendMail({
            to: email,
            from: provider.from,
            subject: `Link de acesso para Gestão Condomínio`,
            text: `Use este link para entrar: ${url}\n`,
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
          console.log(
            `[Auth] Resultado do sendMail para ${email}:`,
            result.response
          ); // Log do resultado SMTP
          const failed = result.rejected.concat(result.pending).filter(Boolean);
          if (failed.length) {
            console.error(
              `[Auth] Falha ao enviar email para: ${failed.join(", ")}`
            );
            throw new Error(
              `Falha no envio do email para ${failed.join(", ")}`
            );
          }
          console.log(`[Auth] Link mágico enviado com sucesso para: ${email}`);
        } catch (error) {
          console.error(
            `[Auth] Erro ao ENVIAR email para ${email} via Nodemailer:`,
            error
          );
          // Re-lança o erro para que o NextAuth possa capturá-lo como SIGNIN_EMAIL_ERROR
          throw new Error(`Erro ao enviar email: ${(error as Error).message}`);
        }
      },
    }),
    // Outros providers...
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email ?? undefined },
          select: { role: true, isActive: true },
        });
        if (dbUser?.isActive) {
          token.role = dbUser.role || UserRole.MORADOR;
          token.isActive = dbUser.isActive;
        } else {
          return {};
        }
      }
      if (!token.isActive) {
        return {};
      }
      return token;
    },
    async session({ session, token }) {
      if (
        token?.id &&
        token?.role &&
        token?.isActive === true &&
        session.user
      ) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        // session.user.isActive = token.isActive as boolean; // Opcional
      } else {
        return {} as any;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  // pages: { signIn: '/signin', error: '/auth/error' } // Exemplo
};

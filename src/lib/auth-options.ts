/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { UserRole } from "@prisma/client"; // Importa UserRole
import nodemailer from "nodemailer"; // Importa nodemailer (ainda necessário para a função customizada)
import { prisma } from "@/lib/prisma"; // Importa o singleton do Prisma

// Definição e EXPORTAÇÃO do objeto authOptions
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      // --- MODIFICAÇÃO AQUI ---
      // Em vez de uma string única, passamos um objeto de configuração
      server: {
        host: process.env.EMAIL_SERVER_HOST || "smtp.resend.com", // Usa variável ou valor padrão
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587", 10), // Usa variável ou valor padrão (porta 587 para TLS/STARTTLS)
        auth: {
          user: process.env.EMAIL_SERVER_USER || "resend", // Usuário é sempre 'resend'
          pass: process.env.RESEND_API_KEY, // A senha é a API Key do Resend
        },
        secure: parseInt(process.env.EMAIL_SERVER_PORT || "587", 10) === 465, // true para porta 465, false para outras como 587
      },
      // --- FIM DA MODIFICAÇÃO ---
      from: process.env.EMAIL_FROM, // Continua pegando do .env
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
          // Lança erro específico para NextAuth tratar internamente
          // Isso evita que o email seja enviado, mas não mostra erro explícito ao usuário final por padrão
          throw new Error("UserNotActiveOrNotFound");
        }

        // Envia email se usuário OK
        console.log(
          `[Auth] Usuário ${email} encontrado e ativo. Enviando link mágico...`
        );
        const { host } = new URL(url);

        // Cria o transporte usando as opções do provider (que agora é um objeto)
        const transport = nodemailer.createTransport(provider.server);

        try {
          const result = await transport.sendMail({
            to: email,
            from: provider.from, // Usa o 'from' configurado no provider
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
            result.response // Log mais útil do resultado SMTP
          );
          const failed = result.rejected.concat(result.pending).filter(Boolean);
          if (failed.length) {
            console.error(
              `[Auth] Falha ao enviar email para: ${failed.join(", ")}`
            );
            // Lança erro para NextAuth capturar
            throw new Error(
              `Falha no envio do email para ${failed.join(", ")}`
            );
          }
          console.log(`[Auth] Link mágico enviado com sucesso para: ${email}`);
        } catch (error: unknown) {
          // Tipagem mais segura para o catch
          console.error(
            `[Auth] Erro ao ENVIAR email para ${email} via Nodemailer:`,
            error // Log completo do erro
          );
          // Re-lança o erro para que o NextAuth possa capturá-lo como SIGNIN_EMAIL_ERROR
          // Inclui a mensagem original do erro para melhor diagnóstico
          if (error instanceof Error) {
            throw new Error(`Erro ao enviar email: ${error.message}`);
          } else {
            throw new Error(`Erro desconhecido ao enviar email.`);
          }
        }
      },
    }),
    // Outros providers...
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Seus callbacks jwt e session aqui...
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email ?? undefined },
          select: { role: true, isActive: true },
        });
        // Apenas adiciona role e isActive se o usuário for encontrado e ativo
        if (dbUser?.isActive) {
          token.role = dbUser.role || UserRole.MORADOR; // Assume MORADOR se role for null
          token.isActive = dbUser.isActive;
        } else {
          // Se usuário não encontrado ou inativo no DB, invalida o token retornando objeto vazio
          console.warn(
            `[Auth] JWT Callback: Usuário ${user.email} não encontrado ou inativo no DB. Invalidando token.`
          );
          return {};
        }
      }
      // Verifica se o token ainda é válido (tem id e está ativo) em requisições subsequentes
      if (!token.id || !token.isActive) {
        console.warn(
          `[Auth] JWT Callback: Token inválido ou usuário inativo. Retornando token vazio.`
        );
        return {};
      }
      return token;
    },
    async session({ session, token }) {
      // Verifica se o token contém as informações necessárias e se o usuário da sessão existe
      if (
        token?.id &&
        token?.role &&
        token?.isActive === true &&
        session.user
      ) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        // session.user.isActive = token.isActive as boolean; // Opcional adicionar à sessão
      } else {
        // Se o token for inválido, retorna uma sessão vazia ou lança erro
        // Retornar {} pode causar problemas se o front-end esperar um usuário
        // Considere redirecionar para logout ou retornar null/undefined dependendo da sua lógica de UI
        console.warn(
          `[Auth] Session Callback: Token inválido ou ausente. Retornando sessão vazia.`
        );
        return {} as any; // Retorna objeto vazio para indicar sessão inválida
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  // pages: { signIn: '/signin', error: '/auth/error' } // Exemplo
};

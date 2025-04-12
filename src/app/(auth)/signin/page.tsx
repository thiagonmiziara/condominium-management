"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  useEffect(() => {
    const error = searchParams?.get("error");
    if (error) {
      let errorMessage = "Ocorreu um erro durante o login.";
      if (error === "EmailSendError" || error === "VerificationEmailNotSent") {
        errorMessage =
          "Não foi possível enviar o email de login. Verifique o email digitado ou as configurações do servidor.";
      } else if (error === "EmailSignin" || error === "Verification") {
        errorMessage =
          "O link de login é inválido ou expirou. Por favor, tente novamente.";
      } else if (error === "AccessDenied") {
        errorMessage = "Acesso negado. Você não tem permissão.";
      }
      toast.error("Erro de Autenticação", { description: errorMessage });
      router.replace("/signin");
    }
  }, [searchParams, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setEmailSent(false);

    try {
      const result = await signIn("email", {
        email: email,
        redirect: false,
      });

      if (result?.error) {
        console.error("SignIn Error:", result.error);

        if (
          ![
            "EmailSendError",
            "VerificationEmailNotSent",
            "EmailSignin",
            "Verification",
            "AccessDenied",
          ].includes(result.error)
        ) {
          toast.error("Erro ao tentar login", {
            description: "Ocorreu um erro inesperado.",
          });
        }
      } else if (result?.ok) {
        setEmailSent(true);
        toast.info("Verifique seu Email", {
          description: "Enviamos um link mágico para seu email.",
        });
      } else {
        throw new Error("Resposta inesperada do servidor de autenticação.");
      }
    } catch (err) {
      console.error("Erro no Handle Submit:", err);
      toast.error("Erro ao Solicitar Link", {
        description:
          err instanceof Error ? err.message : "Ocorreu um erro inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className='flex items-center justify-center min-h-screen bg-zinc-900'>
        <p className='text-zinc-400 animate-pulse'>Carregando...</p>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-4'>
      <Card
        className={cn(
          "w-full max-w-sm sm:max-w-lg",
          "bg-black/40 backdrop-blur-lg",
          "border border-zinc-700/80",
          "text-zinc-200 shadow-2xl shadow-black/30"
        )}
      >
        <CardHeader className='text-center space-y-2 pt-8'>
          <Building2 className='mx-auto h-8 w-8 text-cyan-500' />
          <CardTitle className='text-2xl font-semibold text-cyan-400 tracking-tight'>
            Gestão Condomínio
          </CardTitle>
          <CardDescription className='text-zinc-400 !mt-1'>
            {emailSent
              ? "Link enviado com sucesso!"
              : "Acesse o sistema usando seu email"}
          </CardDescription>
        </CardHeader>
        {emailSent ? (
          <CardContent className='py-8'>
            <p className='text-base text-center text-zinc-300 leading-relaxed'>
              Verifique sua caixa de entrada (e também a pasta de spam) para
              encontrar o link de acesso mágico.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className='space-y-4 pt-4 pb-2'>
              <div className='space-y-2'>
                <Label htmlFor='email' className='text-zinc-400'>
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='seu@email.com'
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className='bg-zinc-800/80 border-zinc-700 h-10 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
                />
              </div>
            </CardContent>

            <CardFooter className='pt-4 pb-6'>
              <Button
                type='submit'
                className='w-full h-10 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar Link de Acesso"}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}

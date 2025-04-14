import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  MessageSquare,
  Users,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const featuresList = [
  {
    icon: <BarChart className='w-10 h-10 text-cyan-400' />,
    title: "Financeiro Transparente",
    description:
      "Controle total sobre receitas e despesas, com relatórios claros e acessíveis.",
  },
  {
    icon: <MessageSquare className='w-10 h-10 text-cyan-400' />,
    title: "Comunicação Centralizada",
    description:
      "Mural de avisos para manter todos os moradores informados com facilidade.",
  },
  {
    icon: <Users className='w-10 h-10 text-cyan-400' />,
    title: "Organização Completa",
    description:
      "Cadastro de moradores e informações importantes sempre à mão.",
  },
  {
    icon: <ShieldCheck className='w-10 h-10 text-cyan-400' />,
    title: "Acesso Fácil e Seguro",
    description:
      "Login simplificado por email (link mágico) para síndicos e moradores.",
  },
];

const howItWorksSteps = [
  {
    step: "1",
    title: "Cadastro",
    description:
      "Registre seu condomínio e crie seu perfil de síndico na plataforma.",
  },
  {
    step: "2",
    title: "Configuração",
    description:
      "Configure as informações do seu condomínio e convide os moradores.",
  },
  {
    step: "3",
    title: "Utilização",
    description:
      "Comece a gerenciar finanças, comunicados e dados dos moradores.",
  },
];

export default function LandingPage() {
  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-100 font-sans'>
      <header className='absolute top-0 left-0 right-0 z-20 p-4 flex justify-end'>
        <Link href='/signin' passHref>
          <Button
            variant='ghost'
            className='text-zinc-300 hover:text-cyan-400 hover:bg-zinc-800'
          >
            Acessar
          </Button>
        </Link>
      </header>

      <section className='relative min-h-[90vh] flex flex-col items-center justify-center px-4 md:px-8 lg:px-16 overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 opacity-80 z-0'></div>

        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1493397212122-2b85dda8106b?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 z-[-1]"></div>

        <div className='container mx-auto max-w-6xl z-10 text-center'>
          <div className='space-y-8'>
            <h1 className='text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight'>
              <span className='text-zinc-100'>Gestão Condominial </span>
              <span className='text-cyan-400 font-extrabold'>
                Simplificada e Transparente
              </span>
            </h1>

            <p className='text-lg md:text-xl max-w-3xl mx-auto text-zinc-300 font-light'>
              Controle financeiro, comunicação eficiente e organização completa
              em uma única plataforma. Desenvolvida especialmente para síndicos
              e administradores de condomínios.
            </p>

            <div className='pt-6'>
              <Link
                href='/signin'
                className='inline-block bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-8 rounded-md transition-all duration-300 shadow-lg hover:shadow-cyan-600/20 text-lg transform hover:scale-105' // Efeito de escala no hover
              >
                Acessar o Sistema
              </Link>
            </div>

            <div className='pt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto'>
              {[
                "Controle Financeiro Integrado",
                "Dashboard com Gráficos",
                "Acesso Seguro por E-mail",
              ].map((feature, index) => (
                <div
                  key={index}
                  className='flex items-center justify-center space-x-2'
                >
                  <CheckCircle className='w-5 h-5 text-cyan-400 flex-shrink-0' />
                  <span className='text-sm md:text-base text-zinc-300'>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id='features' className='py-20 bg-zinc-900'>
        <div className='container mx-auto max-w-6xl px-4 md:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold mb-4'>
              Funcionalidades <span className='text-cyan-400'>Essenciais</span>
            </h2>
            <p className='text-zinc-300 max-w-2xl mx-auto'>
              Nosso sistema oferece todas as ferramentas necessárias para uma
              gestão condominial moderna, eficiente e transparente.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6'>
            {featuresList.map((feature, index) => (
              <div
                key={index}
                className='bg-zinc-800/50 p-6 rounded-lg shadow-lg border border-zinc-700/50 hover:border-cyan-600/50 hover:shadow-cyan-900/20 transition-all duration-300 hover:translate-y-[-5px]' // Efeito hover
              >
                <div className='mb-4'>{feature.icon}</div>{" "}
                <h3 className='text-xl font-semibold mb-2 text-white'>
                  {feature.title}
                </h3>
                <p className='text-zinc-400 text-sm'>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id='how-it-works' className='py-20 bg-zinc-950'>
        <div className='container mx-auto max-w-6xl px-4 md:px-8'>
          <div className='text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold mb-4'>
              Como <span className='text-cyan-400'>Funciona</span>
            </h2>
            <p className='text-zinc-300 max-w-2xl mx-auto'>
              Comece a usar nossa plataforma em poucos passos e transforme a
              gestão do seu condomínio.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12'>
            {howItWorksSteps.map((step, index) => (
              <div key={index} className='flex items-start gap-4'>
                <div className='flex-shrink-0 w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md mt-1'>
                  {step.step}
                </div>

                <div>
                  <h3 className='text-xl font-semibold mb-1 text-white'>
                    {step.title}
                  </h3>{" "}
                  <p className='text-zinc-400 text-sm'>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='py-20 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900'>
        <div className='container mx-auto max-w-4xl px-4 md:px-8 text-center'>
          <h2 className='text-3xl md:text-4xl font-bold mb-6 text-white'>
            Pronto para modernizar a gestão do seu{" "}
            <span className='text-cyan-400'>condomínio?</span>
          </h2>
          <p className='text-zinc-300 max-w-2xl mx-auto mb-8'>
            Acesse agora mesmo o sistema e descubra como nossa plataforma pode
            simplificar sua rotina administrativa.
          </p>

          <Link
            href='/signin'
            className='inline-flex items-center bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-8 rounded-md transition-all duration-300 shadow-lg hover:shadow-cyan-600/20 text-lg transform hover:scale-105'
          >
            Começar Agora
            <ArrowRight className='ml-2 w-5 h-5' />
          </Link>
        </div>
      </section>

      <footer className='py-8 bg-zinc-950 border-t border-zinc-800'>
        <div className='container mx-auto max-w-6xl px-4 md:px-8'>
          <div className='flex flex-col md:flex-row justify-between items-center text-center md:text-left'>
            <div className='mb-4 md:mb-0'>
              <p className='text-zinc-500 text-sm'>
                © {new Date().getFullYear()} Gestão Condomínio. Todos os
                direitos reservados.
              </p>
            </div>

            <div className='flex space-x-6'>
              {/* <Link
                href='#'
                className='text-zinc-500 hover:text-cyan-400 text-sm transition-colors'
              >
                Termos
              </Link>
              <Link
                href='#'
                className='text-zinc-500 hover:text-cyan-400 text-sm transition-colors'
              >
                Privacidade
              </Link>
              <Link
                href='#'
                className='text-zinc-500 hover:text-cyan-400 text-sm transition-colors'
              >
                Suporte
              </Link> */}
              <p className='text-cyan-400 text-sm'>Deus seja louvado.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

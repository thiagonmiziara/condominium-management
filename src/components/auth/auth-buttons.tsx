import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogOut, LogIn } from "lucide-react";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button variant='outline' className='w-full' disabled>
        Carregando...
      </Button>
    );
  }

  if (session) {
    return (
      <div className='flex flex-col items-center space-y-2'>
        <p className='text-sm text-muted-foreground text-center px-2 break-words'>
          {session.user?.name || session.user?.email}
          {session.user?.role && (
            <span className='block text-xs capitalize text-primary/80'>
              ({session.user.role.toLowerCase()})
            </span>
          )}
        </p>
        <Button
          variant='ghost'
          onClick={() => signOut()}
          className='w-full text-destructive hover:text-destructive'
        >
          <LogOut className='mr-2 h-4 w-4' /> Sair
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn()} className='w-full'>
      <LogIn className='mr-2 h-4 w-4' /> Entrar
    </Button>
  );
}

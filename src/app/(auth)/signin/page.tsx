import { Suspense } from "react";
import SignInContent from "./signin-content";

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className='text-zinc-400 text-center mt-20'>Carregando...</div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

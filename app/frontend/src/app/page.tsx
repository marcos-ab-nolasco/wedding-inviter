"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const features = [
  {
    title: "Lista de convidados",
    description:
      "Cadastre todos os seus convidados com informações de contato, relacionamento e tom ideal.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-stone-600"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
        />
      </svg>
    ),
  },
  {
    title: "Convites personalizados por IA",
    description:
      "Gere mensagens únicas para cada convidado com base na sua relação e memórias compartilhadas.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-stone-600"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
        />
      </svg>
    ),
  },
  {
    title: "Acompanhe as respostas",
    description:
      "Veja em tempo real quem confirmou presença, quem está incerto e quem não poderá comparecer.",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5 text-stone-600"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
        />
      </svg>
    ),
  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-semibold text-stone-900 tracking-tight">
            Wedding Inviter
          </span>
          <nav className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="flex flex-col items-center text-center px-6 pt-24 pb-20">
          <p className="text-xs font-semibold tracking-widest uppercase text-stone-400 mb-6">
            Convites personalizados com IA
          </p>
          <h1 className="max-w-2xl text-5xl sm:text-6xl font-bold text-stone-900 leading-tight tracking-tight mb-6">
            Convites de casamento{" "}
            <span className="italic font-light text-stone-400">únicos para cada</span> convidado
          </h1>
          <p className="max-w-xl text-lg text-stone-500 leading-relaxed mb-10">
            Crie, gerencie e personalize os convites do seu casamento com inteligência artificial.
            Cada convidado recebe uma mensagem que realmente importa.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="px-7 py-3 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition-colors"
            >
              Começar gratuitamente
            </Link>
            <Link
              href="/login"
              className="px-7 py-3 border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
            >
              Já tenho uma conta
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border border-stone-200 bg-white">
                <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="bg-stone-50 border-t border-stone-200 px-6 py-16">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-stone-900 mb-4 tracking-tight">
              Pronto para começar?
            </h2>
            <p className="text-stone-500 mb-8">
              Crie sua conta gratuitamente e comece a personalizar seus convites hoje.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-700 transition-colors"
            >
              Criar minha conta
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center">
        <p className="text-xs text-stone-400">© 2026 Wedding Inviter. Feito com carinho.</p>
      </footer>
    </div>
  );
}

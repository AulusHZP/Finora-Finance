import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          {/* Logo/Branding */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center h-20 w-20 mb-6">
              <img src="/logo.png" alt="Finora" className="w-full h-full" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Finora</h1>
          </div>

          {/* Tagline */}
          <p className="text-xl text-slate-600 leading-relaxed mb-12">
            Tome o controle de suas finanças
          </p>

          {/* Subtle Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm text-blue-600">✓</span>
              </div>
              <p className="text-sm text-slate-600">Acompanhe seus gastos com facilidade</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm text-blue-600">✓</span>
              </div>
              <p className="text-sm text-slate-600">Alcance suas metas financeiras</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm text-blue-600">✓</span>
              </div>
              <p className="text-sm text-slate-600">Insights inteligentes e análises</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

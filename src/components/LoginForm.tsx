import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSignupClick: () => void;
}

export function LoginForm({ onSubmit, onSignupClick }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors({});
      await onSubmit(email, password);
    } catch (error) {
      setErrors({ general: "Invalid email or password" });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email.trim() && password && !loading;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Bem-vindo de volta</h1>
        <p className="text-slate-600 text-sm">Entre em sua conta Finora</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error */}
        {errors.general && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="joao@exemplo.com"
              className={`w-full h-11 pl-10 pr-4 rounded-lg border transition-all duration-200 text-sm placeholder:text-slate-400 focus:outline-none ${
                errors.email
                  ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                  : "border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              }`}
            />
          </div>
          {errors.email && <p className="text-sm text-red-600 mt-1.5">{errors.email}</p>}
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-slate-900">
              Senha
            </label>
            <button
              type="button"
              onClick={() => {}}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Esqueceu a senha?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              placeholder="••••••••"
              className={`w-full h-11 pl-10 pr-11 rounded-lg border transition-all duration-200 text-sm placeholder:text-slate-400 focus:outline-none ${
                errors.password
                  ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                  : "border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-600 mt-1.5">{errors.password}</p>}
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full h-11 rounded-lg font-medium text-sm transition-all duration-200 mt-6 ${
            isFormValid
              ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm hover:shadow-md"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Entrando...
            </span>
          ) : (
            "Entrar"
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-slate-500">Não tem uma conta?</span>
          </div>
        </div>

        {/* Sign Up Link */}
        <button
          type="button"
          onClick={onSignupClick}
          className="w-full h-11 rounded-lg font-medium text-sm border border-slate-300 text-slate-900 hover:bg-slate-50 transition-colors"
        >
          Criar conta
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          Ao entrar, você concorda com nossos{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Termos de Serviço
          </a>
          {" "}e{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

interface SignupFormProps {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  onLoginClick: () => void;
}

export function SignupForm({ onSubmit, onLoginClick }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const passwordStrength = {
    score: 0,
    level: "weak" as "weak" | "fair" | "good" | "strong",
  };

  // Calculate password strength
  if (password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;

    passwordStrength.score = score;
    if (score <= 1) passwordStrength.level = "weak";
    else if (score === 2) passwordStrength.level = "fair";
    else if (score === 3) passwordStrength.level = "good";
    else passwordStrength.level = "strong";
  }

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Nome e obrigatorio";
    } else if (name.trim().length < 2) {
      newErrors.name = "Nome deve ter no minimo 2 caracteres";
    }

    if (!email.trim()) {
      newErrors.email = "Email e obrigatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Digite um email valido";
    }

    if (!password) {
      newErrors.password = "Senha e obrigatoria";
    } else if (password.length < 8) {
      newErrors.password = "Senha deve ter no minimo 8 caracteres";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirme sua senha";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas nao coincidem";
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
      await onSubmit(name, email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar conta";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = name.trim() && email.trim() && password && confirmPassword && !loading;

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.level) {
      case "weak":
        return "bg-red-500";
      case "fair":
        return "bg-orange-500";
      case "good":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength.level) {
      case "weak":
        return "Fraca";
      case "fair":
        return "Razoavel";
      case "good":
        return "Boa";
      case "strong":
        return "Forte";
    }
  };

  return (
    <div>
      {/* Header with Back Button */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Criar sua conta</h1>
          <p className="text-slate-600 text-sm">Entre no Finora e controle suas financas</p>
        </div>
        <button
          type="button"
          onClick={onLoginClick}
          className="mt-1 p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
          title="Voltar para login"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
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

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-900 mb-2">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              placeholder="João Silva"
              className={`w-full h-11 pl-10 pr-4 rounded-lg border transition-all duration-200 text-sm placeholder:text-slate-400 focus:outline-none ${
                errors.name
                  ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                  : "border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              }`}
            />
          </div>
          {errors.name && <p className="text-sm text-red-600 mt-1.5">{errors.name}</p>}
        </div>

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
          <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-2">
            Senha
          </label>
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

          {/* Password Strength */}
          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600">{getPasswordStrengthText()}</span>
              </div>
              <p className="text-xs text-slate-500">Use maiúsculas, números e símbolos para uma senha mais forte</p>
            </div>
          )}

          {errors.password && <p className="text-sm text-red-600 mt-1.5">{errors.password}</p>}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-900 mb-2">
            Confirme a senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }}
              placeholder="••••••••"
              className={`w-full h-11 pl-10 pr-11 rounded-lg border transition-all duration-200 text-sm placeholder:text-slate-400 focus:outline-none ${
                errors.confirmPassword
                  ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
                  : password === confirmPassword && confirmPassword
                    ? "border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/10"
                    : "border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {password === confirmPassword && confirmPassword ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-sm text-red-600 mt-1.5">{errors.confirmPassword}</p>}
        </div>

        {/* Create Account Button */}
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
              Criando conta...
            </span>
          ) : (
            "Criar conta"
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white text-slate-500">Já tem uma conta?</span>
          </div>
        </div>

        {/* Sign In Link */}
        <button
          type="button"
          onClick={onLoginClick}
          className="w-full h-11 rounded-lg font-medium text-sm border border-slate-300 text-slate-900 hover:bg-slate-50 transition-colors"
        >
          Entrar
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-slate-500">
          Ao criar uma conta, você concorda com nossos{" "}
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

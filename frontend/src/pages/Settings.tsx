import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { LogOut, Mail, DollarSign, Bell, BarChart3, Check, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  clearAuthSession,
  getStoredUser,
  logoutRequest,
  meRequest,
  setStoredUser,
  updateProfileRequest
} from "@/lib/auth";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState("BRL (R$)");
  const [closingDay, setClosingDay] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const cachedUser = getStoredUser();
        if (cachedUser) {
          setName(cachedUser.name);
          setEmail(cachedUser.email);
          setClosingDay(cachedUser.creditCardClosingDay ? String(cachedUser.creditCardClosingDay) : "");
        }

        const user = await meRequest();
        setStoredUser(user);
        setName(user.name);
        setEmail(user.email);
        setClosingDay(user.creditCardClosingDay ? String(user.creditCardClosingDay) : "");
      } catch {
        clearAuthSession();
        navigate("/auth");
      }
    };

    void hydrate();
  }, [navigate]);

  const handleSaveProfile = async () => {
    const parsedClosingDay = closingDay.trim() ? Number.parseInt(closingDay, 10) : null;

    if (parsedClosingDay !== null && (!Number.isInteger(parsedClosingDay) || parsedClosingDay < 1 || parsedClosingDay > 31)) {
      setMessage("O dia de fechamento da fatura deve estar entre 1 e 31");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const updated = await updateProfileRequest({ name, email, creditCardClosingDay: parsedClosingDay });
      setStoredUser(updated);
      setName(updated.name);
      setEmail(updated.email);
      setClosingDay(updated.creditCardClosingDay ? String(updated.creditCardClosingDay) : "");
      setMessage("Perfil atualizado com sucesso");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Falha ao atualizar perfil";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Logout em JWT stateless e seguro mesmo em caso de erro de rede.
    } finally {
      clearAuthSession();
      navigate("/auth");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-2">Gerencie seu perfil e preferências</p>
        </div>

        {/* Profile Card */}
        <div className="mb-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border-2 border-primary/40">
              <span className="text-lg font-bold text-primary">
                {name
                  .split(" ")
                  .map((part) => part.charAt(0))
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "US"}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">{name || "Usuário"}</h2>
              <p className="text-sm text-muted-foreground mt-1">{email || "email@example.com"}</p>
            </div>
          </div>
        </div>

        {/* Perfil Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            Informações Pessoais
          </h3>
          <div className="space-y-4 bg-card rounded-xl border border-border p-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-card border-2 border-border hover:border-primary/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-card border-2 border-border hover:border-primary/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Moeda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled
                className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl text-sm text-muted-foreground focus:outline-none transition-all font-medium appearance-none cursor-not-allowed opacity-70"
              >
                <option>BRL (R$)</option>
              </select>
              <p className="text-[11px] text-muted-foreground mt-1.5">Por enquanto, apenas BRL é suportado.</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                Dia de fechamento da fatura do cartão
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                placeholder="Ex: 28 (vazio = desligado)"
                className="w-full px-4 py-3 bg-card border-2 border-border hover:border-primary/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Com o dia configurado, o dashboard agrupa as compras no crédito por fatura (atual e próxima).
              </p>
            </div>
          </div>
        </div>

        {/* Preferências Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            Notificações e Preferências
          </h3>
          <div className="space-y-3 bg-card rounded-xl border border-border p-5">
            {/* Notificações ainda não implementadas — controles desabilitados até existir backend para isso */}
            <div className="flex items-center justify-between p-4 rounded-lg opacity-60">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">Alertas de Orçamento</p>
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Em breve</span>
                </div>
                <p className="text-xs text-muted-foreground">Receba notificações ao atingir o limite de gastos</p>
              </div>
              <button disabled className="ml-4 h-6 w-11 bg-muted rounded-full relative flex-shrink-0 cursor-not-allowed">
                <div className="absolute left-0.5 top-0.5 h-5 w-5 bg-card rounded-full shadow-sm border border-border" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border-t border-border opacity-60">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">Resumo Semanal</p>
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Em breve</span>
                </div>
                <p className="text-xs text-muted-foreground">Relatório semanal dos seus gastos e receitas</p>
              </div>
              <button disabled className="ml-4 h-6 w-11 bg-muted rounded-full relative flex-shrink-0 cursor-not-allowed">
                <div className="absolute left-0.5 top-0.5 h-5 w-5 bg-card rounded-full shadow-sm border border-border" />
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.includes("sucesso")
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-destructive/10 border border-destructive/30"
          }`}>
            {message.includes("sucesso") ? (
              <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${
              message.includes("sucesso") ? "text-green-600" : "text-destructive"
            }`}>
              {message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSaveProfile}
            disabled={loading || !name.trim() || !email.trim()}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-destructive/10 text-destructive rounded-lg text-sm font-semibold hover:bg-destructive/20 transition-all border border-destructive/20 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

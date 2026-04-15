import { AppLayout } from "@/components/AppLayout";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

const SettingsPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Limpar dados locais se houver
    localStorage.removeItem("user");
    // Redirecionar para login
    navigate("/auth");
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie suas preferências</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Perfil</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
              <input type="text" defaultValue="John Doe" className="w-full h-9 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <input type="email" defaultValue="john@example.com" className="w-full h-9 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Moeda</label>
              <select className="w-full h-9 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>BRL (R$)</option>
                <option>GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Preferências</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Alertas de Orçamento</p>
                <p className="text-xs text-muted-foreground">Notificação ao atingir o limite do orçamento</p>
              </div>
              <div className="h-6 w-10 bg-primary rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 h-5 w-5 bg-primary-foreground rounded-full shadow-sm transition-default" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Resumo Semanal</p>
                <p className="text-xs text-muted-foreground">Receba relatórios de gastos semanais</p>
              </div>
              <div className="h-6 w-10 bg-muted rounded-full relative cursor-pointer">
                <div className="absolute left-0.5 top-0.5 h-5 w-5 bg-card rounded-full shadow-sm transition-default" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default">
            Salvar Alterações
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-default flex items-center gap-2 whitespace-nowrap"
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

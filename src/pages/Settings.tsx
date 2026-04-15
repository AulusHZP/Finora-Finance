import { AppLayout } from "@/components/AppLayout";

const SettingsPage = () => {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your preferences</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Profile</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
              <input type="text" defaultValue="John Doe" className="w-full h-9 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <input type="email" defaultValue="john@example.com" className="w-full h-9 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-default" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
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
          <h3 className="text-sm font-semibold text-foreground mb-3">Preferences</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Monthly Budget Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified when nearing your budget limit</p>
              </div>
              <div className="h-6 w-10 bg-primary rounded-full relative cursor-pointer">
                <div className="absolute right-0.5 top-0.5 h-5 w-5 bg-primary-foreground rounded-full shadow-sm transition-default" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Weekly Summary</p>
                <p className="text-xs text-muted-foreground">Receive weekly spending reports</p>
              </div>
              <div className="h-6 w-10 bg-muted rounded-full relative cursor-pointer">
                <div className="absolute left-0.5 top-0.5 h-5 w-5 bg-card rounded-full shadow-sm transition-default" />
              </div>
            </div>
          </div>
        </div>

        <button className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-default">
          Save Changes
        </button>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

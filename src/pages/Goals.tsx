import { AppLayout } from "@/components/AppLayout";
import { GoalCards } from "@/components/GoalCards";

const Goals = () => {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Goals</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track your savings targets</p>
      </div>
      <GoalCards />
    </AppLayout>
  );
};

export default Goals;

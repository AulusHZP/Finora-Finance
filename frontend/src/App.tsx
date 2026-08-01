import { lazy, Suspense, Component, type ReactNode, type ErrorInfo } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4 p-6">
          <h1 className="text-xl font-semibold text-foreground">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Ocorreu um erro inesperado. Recarregue a página para continuar.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Index = lazy(() => import("./pages/Index.tsx"));
const Transactions = lazy(() => import("./pages/Transactions.tsx"));
const Goals = lazy(() => import("./pages/Goals.tsx"));
const Limits = lazy(() => import("./pages/Limits.tsx"));
const Categories = lazy(() => import("./pages/Categories.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const GlobalFallback = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    <p className="text-sm text-muted-foreground font-medium animate-pulse">Carregando...</p>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<GlobalFallback />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/limits" element={<Limits />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;

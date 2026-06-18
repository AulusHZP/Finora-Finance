import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";
import {
  getStoredToken,
  loginRequest,
  registerRequest,
  storeAuthSession
} from "@/lib/auth";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  useEffect(() => {
    if (getStoredToken()) {
      navigate("/");
      return;
    }
    // Preload the dashboard chunk while the user fills in the form
    void import("./Index.tsx");
  }, [navigate]);

  const handleLogin = async (email: string, password: string) => {
    const data = await loginRequest({ email, password });
    storeAuthSession(data);
    navigate("/");
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    const data = await registerRequest({ name, email, password });
    storeAuthSession(data);
    navigate("/");
  };

  return (
    <AuthLayout>
      {mode === "login" ? (
        <LoginForm onSubmit={handleLogin} onSignupClick={() => setMode("signup")} />
      ) : (
        <SignupForm onSubmit={handleSignup} onLoginClick={() => setMode("login")} />
      )}
    </AuthLayout>
  );
}

export default AuthPage;

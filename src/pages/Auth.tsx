import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";
import {
  getStoredToken,
  loginRequest,
  meRequest,
  registerRequest,
  setStoredUser,
  storeAuthSession
} from "@/lib/auth";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  useEffect(() => {
    if (getStoredToken()) {
      navigate("/");
    }
  }, [navigate]);

  const finishAuth = async () => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Sessao invalida");
    }

    const user = await meRequest();
    setStoredUser(user);
    navigate("/");
  };

  const handleLogin = async (email: string, password: string) => {
    const data = await loginRequest({ email, password });
    storeAuthSession(data);
    await finishAuth();
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    const data = await registerRequest({ name, email, password });
    storeAuthSession(data);
    await finishAuth();
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

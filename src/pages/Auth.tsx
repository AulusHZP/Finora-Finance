import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In a real app, you'd verify credentials and store auth token
    navigate("/");
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In a real app, you'd create the account and store auth token
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

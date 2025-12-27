"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useForm } from "react-hook-form";
import FirebaseConfigError from "./FirebaseConfigError";

interface SignInForm {
  email: string;
  password: string;
}

interface SignUpForm {
  name: string;
  email: string;
  password: string;
  book: string;
  totalPages: number;
}

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showConfigError, setShowConfigError] = useState(false);
  const { signIn, signUp, loading, error, clearError } = useAuth();

  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors },
  } = useForm<SignInForm>();

  const {
    register: registerSignUp,
    handleSubmit: handleSignUpSubmit,
    formState: { errors: signUpErrors },
  } = useForm<SignUpForm>();

  const onSignIn = async (data: SignInForm) => {
    try {
      clearError();
      setShowConfigError(false);
      await signIn(data.email, data.password);
    } catch (error: any) {
      if (error.message?.includes("configurado")) {
        setShowConfigError(true);
      }
    }
  };

  const onSignUp = async (data: SignUpForm) => {
    try {
      clearError();
      setShowConfigError(false);
      await signUp(
        data.email,
        data.password,
        data.name,
        data.book,
        data.totalPages
      );
    } catch (error: any) {
      if (error.message?.includes("configurado")) {
        setShowConfigError(true);
      }
    }
  };

  // Show configuration error screen
  if (showConfigError) {
    return <FirebaseConfigError />;
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            📚 Clube do Livro
          </h1>
          <p className="text-slate-400">
            {isSignUp ? "Entre para o clube!" : "Bem-vindo de volta!"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {isSignUp ? (
          <form onSubmit={handleSignUpSubmit(onSignUp)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome
              </label>
              <input
                {...registerSignUp("name", { required: "Nome é obrigatório" })}
                type="text"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                placeholder="Seu nome"
              />
              {signUpErrors.name && (
                <p className="text-red-400 text-sm mt-1">
                  {signUpErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                {...registerSignUp("email", {
                  required: "Email é obrigatório",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Email inválido",
                  },
                })}
                type="email"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                placeholder="seu@email.com"
              />
              {signUpErrors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {signUpErrors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <input
                {...registerSignUp("password", {
                  required: "Senha é obrigatória",
                  minLength: {
                    value: 6,
                    message: "Senha deve ter pelo menos 6 caracteres",
                  },
                })}
                type="password"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                placeholder="Sua senha"
              />
              {signUpErrors.password && (
                <p className="text-red-400 text-sm mt-1">
                  {signUpErrors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Livro que está lendo
              </label>
              <input
                {...registerSignUp("book", {
                  required: "Nome do livro é obrigatório",
                })}
                type="text"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                placeholder="Nome do livro"
              />
              {signUpErrors.book && (
                <p className="text-red-400 text-sm mt-1">
                  {signUpErrors.book.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Total de páginas do livro
              </label>
              <input
                {...registerSignUp("totalPages", {
                  required: "Número de páginas é obrigatório",
                  min: {
                    value: 1,
                    message: "Número de páginas deve ser maior que 0",
                  },
                })}
                type="number"
                min="1"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                placeholder="300"
              />
              {signUpErrors.totalPages && (
                <p className="text-red-400 text-sm mt-1">
                  {signUpErrors.totalPages.message}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                Sua meta diária será calculada dividindo por 30 dias
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Criando conta...
                </>
              ) : (
                "Entrar para o clube"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignInSubmit(onSignIn)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                {...registerSignIn("email", {
                  required: "Email é obrigatório",
                })}
                type="email"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                placeholder="seu@email.com"
              />
              {signInErrors.email && (
                <p className="text-red-400 text-sm mt-1">
                  {signInErrors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Senha
              </label>
              <input
                {...registerSignIn("password", {
                  required: "Senha é obrigatória",
                })}
                type="password"
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                placeholder="Sua senha"
              />
              {signInErrors.password && (
                <p className="text-red-400 text-sm mt-1">
                  {signInErrors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-green-400 hover:text-green-300 text-sm"
          >
            {isSignUp
              ? "Já tem uma conta? Faça login"
              : "Não tem conta? Entre para o clube"}
          </button>
        </div>
      </div>
    </div>
  );
}

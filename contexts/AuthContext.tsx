"use client";

import { auth, db } from "@/lib/firebase";
import {
  User,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface UserProfile {
  id: string;
  name: string;
  book: string;
  totalPages: number;
  dailyGoal: number;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    name: string,
    book: string,
    totalPages: number
  ) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Timeout fallback in case Firebase doesn't respond
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        clearTimeout(fallbackTimeout);

        setUser(user);

        if (user) {
          try {
            const profileDoc = await getDoc(doc(db, "users", user.uid));
            if (profileDoc.exists()) {
              setProfile({
                id: user.uid,
                ...profileDoc.data(),
                createdAt: profileDoc.data().createdAt.toDate(),
              } as UserProfile);
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          }
        } else {
          setProfile(null);
        }

        setLoading(false);
      });
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      clearTimeout(fallbackTimeout);
      setLoading(false);
    }

    return () => {
      clearTimeout(fallbackTimeout);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setLoading(false);
      console.error("Sign in error:", error);

      let errorMessage = "Erro ao fazer login";

      // Handle specific Firebase errors
      if (
        error.code === "auth/configuration-not-found" ||
        error.message?.includes("CONFIGURATION_NOT_FOUND")
      ) {
        errorMessage = "Serviço não configurado. Verifique o Firebase.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Email ou senha incorretos";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    book: string,
    totalPages: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const dailyGoal = Math.ceil(totalPages / 30); // Meta diária baseada em 30 dias

      const userProfile = {
        name,
        book,
        totalPages,
        dailyGoal,
        createdAt: new Date(),
      };

      const a = await setDoc(doc(db, "users", user.uid), userProfile);

      setProfile({
        id: user.uid,
        ...userProfile,
      });
    } catch (error: any) {
      setLoading(false);
      console.error("Sign up error:", error);

      let errorMessage = "Erro ao criar conta";

      // Handle specific Firebase errors
      if (
        error.code === "auth/configuration-not-found" ||
        error.message?.includes("CONFIGURATION_NOT_FOUND")
      ) {
        errorMessage = "Serviço não configurado. Verifique o Firebase.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Senha muito fraca. Use pelo menos 6 caracteres";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

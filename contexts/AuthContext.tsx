/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { auth, db } from "@/lib/firebase";
import {
  User,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Timestamp, doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface CompletedBook {
  title: string;
  totalPages: number;
  finishedAt: Date | Timestamp;
}

export interface UserProfile {
  id: string;
  name: string;
  book: string;
  totalPages: number;
  currentBookPagesRead: number;
  dailyGoal: number;
  createdAt: Date;
  completedBooks?: CompletedBook[];
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

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      clearTimeout(fallbackTimeout);
      setUser(user);
      if (!user) {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(fallbackTimeout);
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (user) {
      const unsubProfile = onSnapshot(
        doc(db, "users", user.uid),
        (profileDoc) => {
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setProfile({
              id: user.uid,
              ...data,
              createdAt: data.createdAt.toDate(),
              completedBooks: (data.completedBooks || []).map((book: any) => ({
                ...book,
                finishedAt: book.finishedAt.toDate(),
              })),
            } as UserProfile);
          }
        },
        (error) => {
          console.error("Error listening to profile changes:", error);
          setError("Erro ao carregar perfil em tempo real.");
        }
      );
      return () => unsubProfile();
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setLoading(false);

      let errorMessage = "Erro ao fazer login";

      // Handle specific Firebase errors
      if (
        error.code === "auth/configuration-not-found" ||
        error.message?.includes("CONFIGURATION_NOT_FOUND")
      ) {
        errorMessage = "Serviço não configurado. Verifique o Firebase.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado. Verifique o e-mail ou crie uma conta.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Email ou senha incorretos";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Muitas tentativas falhas. Tente novamente mais tarde.";
      }

      console.error("Sign in error:", error.code || error.message);

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

      const userProfile: Omit<UserProfile, "id"> = {
        name,
        book,
        totalPages,
        dailyGoal,
        currentBookPagesRead: 0,
        completedBooks: [],
        createdAt: new Date(),
      };

      await setDoc(doc(db, "users", user.uid), userProfile);

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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { auth, db } from "@/lib/firebase";
import {
  User,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  AuthError,
} from "firebase/auth";
import { Timestamp, doc, onSnapshot, setDoc, FirestoreError } from "firebase/firestore";
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

const getErrorMessage = (error: AuthError): string => {
  const code = error.code;
  const message = error.message || "";

  if (code === "auth/configuration-not-found" || message.includes("CONFIGURATION_NOT_FOUND")) {
    return "Serviço não configurado. Verifique o Firebase.";
  }

  if (code === "auth/user-not-found") {
    return "Usuário não encontrado. Verifique o e-mail ou crie uma conta.";
  }

  if (code === "auth/wrong-password") {
    return "Senha incorreta";
  }

  if (code === "auth/invalid-email") {
    return "Email inválido";
  }

  if (code === "auth/invalid-credential") {
    return "Email ou senha incorretos";
  }

  if (code === "auth/too-many-requests") {
    return "Muitas tentativas falhas. Tente novamente mais tarde.";
  }

  if (code === "auth/email-already-in-use") {
    return "Este email já está em uso";
  }

  if (code === "auth/weak-password") {
    return "Senha muito fraca. Use pelo menos 6 caracteres";
  }

  return "Ocorreu um erro inesperado. Tente novamente.";
};

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
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubProfile = onSnapshot(
      doc(db, "users", user.uid),
      (profileDoc) => {
        if (!profileDoc.exists()) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const data = profileDoc.data();
        setProfile({
          id: user.uid,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          completedBooks: (data.completedBooks || []).map((book: CompletedBook) => ({
            ...book,
            finishedAt: book.finishedAt instanceof Timestamp
              ? book.finishedAt.toDate()
              : new Date(book.finishedAt as unknown as string),
          })),
        } as UserProfile);

        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error("Error listening to profile changes:", err);
        setError("Erro ao carregar perfil em tempo real.");
        setLoading(false);
      }
    );

    return () => unsubProfile();
  }, [user]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      setLoading(false);
      const errorMessage = getErrorMessage(err as AuthError);
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
      const { user: newUser } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const dailyGoal = Math.ceil(totalPages / 30);
      const userProfile: Omit<UserProfile, "id"> = {
        name,
        book,
        totalPages,
        dailyGoal,
        currentBookPagesRead: 0,
        completedBooks: [],
        createdAt: new Date(),
      };

      await setDoc(doc(db, "users", newUser.uid), userProfile);
      setProfile({ id: newUser.uid, ...userProfile });
    } catch (err: unknown) {
      setLoading(false);
      const errorMessage = getErrorMessage(err as AuthError);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const clearError = () => setError(null);

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

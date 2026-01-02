/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { createLocalDateString } from "@/lib/dateUtils";
import { db } from "@/lib/firebase";
import { calculateIntensity } from "@/lib/gridUtils";
import { DailyProgressForm } from "@/lib/types";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface DailyProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DailyProgressModal({
  isOpen,
  onClose,
  onSuccess,
}: DailyProgressModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const { profile } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DailyProgressForm>();

  const onSubmit = async (data: DailyProgressForm) => {
    if (!profile) return;

    setLoading(true);
    setError("");

    try {
      const pagesReadFromInput = Number(data.pagesRead);
      const userDocRef = doc(db, "users", profile.id);
      const today = new Date();
      const dateString = createLocalDateString(today);
      const progressDocRef = doc(db, "progress", `${profile.id}_${dateString}`);

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);
        const progressDoc = await transaction.get(progressDocRef);

        if (!userDoc.exists()) {
          throw new Error("Usuário não encontrado.");
        }

        const userData = userDoc.data();
        const currentBookPagesRead = userData.currentBookPagesRead || 0;
        const newTotalRead = currentBookPagesRead + pagesReadToday;
        const intensity = calculateIntensity(pagesReadToday, profile.dailyGoal);

        transaction.set(progressDocRef, {
          userId: profile.id,
          date: dateString,
          pagesRead: totalPagesForToday,
          intensity,
          timestamp: serverTimestamp(),
        });

        const updateData: Record<string, any> = {
          currentBookPagesRead: newTotalRead,
        };

        // Check if book is finished
        if (profile.totalPages > 0 && newTotalRead >= profile.totalPages) {
          const completedBook = {
            title: profile.book,
            totalPages: profile.totalPages,
            finishedAt: new Date(),
          };

          updateData.completedBooks = [...(userData.completedBooks || []), completedBook];
          updateData.book = "";
          updateData.totalPages = 0;
          updateData.dailyGoal = 0;
          updateData.currentBookPagesRead = 0;
        }

        transaction.update(userDocRef, updateData);
      });

      setSuccess(true);
      reset();

      setTimeout(() => {
        setSuccess(false);
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      console.error("Error saving progress:", err);
      if (err.code === "permission-denied") {
        setError("Sem permissão para salvar. Verifique o Firebase.");
        return;
      }
      setError(err.message || "Erro ao salvar progresso");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">
          Progresso de hoje 📖
        </h2>

        {profile && (
          <div className="bg-slate-700/50 p-4 rounded-lg mb-6 border border-slate-600">
            <p className="text-sm text-slate-200 font-medium">
              {profile.book || "Nenhum livro selecionado"}
            </p>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-slate-400">Meta: {profile.dailyGoal} páginas</span>
              {profile.totalPages > 0 && (
                <span className="text-xs text-green-400">
                  Restam {Math.max(0, profile.totalPages - (profile.currentBookPagesRead || 0))} pgs
                </span>
              )}
            </div>
          </div>
        )}

        {success ? (
          <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-green-400 font-bold text-lg">Progresso registrado!</p>
            <p className="text-slate-400 text-sm mt-1">Sua contribuição foi adicionada ao quadro.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantas páginas você leu?
                </label>
                <input
                  {...register("pagesRead", {
                    required: "Informe a quantidade de páginas",
                    min: { value: 0, message: "Não pode ser negativo" },
                  })}
                  type="number"
                  autoFocus
                  className="w-full p-4 bg-slate-900 border border-slate-600 rounded-lg text-white text-2xl font-bold text-center focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                  placeholder="0"
                />
                {errors.pagesRead && (
                  <p className="text-red-400 text-sm mt-2 font-medium">
                    {errors.pagesRead.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold py-3 px-4 rounded-md transition-all shadow-lg shadow-green-900/20"
                >
                  {loading ? "Salvando..." : "Registrar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

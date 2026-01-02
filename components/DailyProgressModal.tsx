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
  onSuccess?: () => void; // Callback para recarregar dados
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
          throw new Error("Documento do usuário não encontrado.");
        }

        const userData = userDoc.data();
        const currentBookPagesRead = userData.currentBookPagesRead || 0;
        const pagesAlreadyReadToday = progressDoc.exists()
          ? Number(progressDoc.data().pagesRead) || 0
          : 0;

        const totalPagesForToday = pagesAlreadyReadToday + pagesReadFromInput;
        const newCurrentBookPagesRead =
          currentBookPagesRead + pagesReadFromInput;

        const intensity = calculateIntensity(
          totalPagesForToday,
          profile.dailyGoal
        );

        // Set daily progress
        transaction.set(progressDocRef, {
          userId: profile.id,
          date: dateString,
          pagesRead: totalPagesForToday,
          intensity,
          timestamp: serverTimestamp(),
        });

        const updateData: { [key: string]: any } = {
          currentBookPagesRead: newCurrentBookPagesRead,
        };

        // Check if book is finished
        if (
          profile.totalPages > 0 &&
          newCurrentBookPagesRead >= profile.totalPages
        ) {
          const completedBook = {
            title: profile.book,
            totalPages: profile.totalPages,
            finishedAt: new Date(),
          };

          const completedBooks = userData.completedBooks || [];

          updateData.completedBooks = [...completedBooks, completedBook];
          // Reseta os dados do livro atual no perfil do usuário.
          // O histórico de progresso na coleção 'progress' não é afetado,
          // garantindo que o heatmap continue exibindo a atividade de livros anteriores.
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
    } catch (error: any) {
      let errorMessage = "Erro ao salvar progresso";
      if (error.code === "permission-denied") {
        errorMessage =
          "Sem permissão para salvar. Verifique as regras do Firestore.";
      } else if (error.message?.includes("offline")) {
        errorMessage = "Sem conexão. Verifique sua internet.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">
          Marcar progresso de hoje
        </h2>

        {profile && (
          <div className="bg-slate-700 p-3 rounded mb-4">
            <p className="text-sm text-slate-300">
              📖 <strong>{profile.book}</strong>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Meta diária: {profile.dailyGoal} páginas
            </p>
            {profile.totalPages > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                Faltam{" "}
                {Math.max(
                  0,
                  profile.totalPages - (profile.currentBookPagesRead || 0)
                )}{" "}
                páginas para terminar.
              </p>
            )}
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400 font-medium">Progresso salvo!</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantas páginas você leu hoje?
                </label>
                <input
                  {...register("pagesRead", {
                    required: "Número de páginas é obrigatório",
                    min: {
                      value: 0,
                      message: "Não pode ser negativo",
                    },
                    // max: {
                    //   value: profile?.dailyGoal ? profile.dailyGoal * 3 : 100,
                    //   message: `Máximo ${
                    //     profile?.dailyGoal ? profile.dailyGoal * 3 : 100
                    //   } páginas`,
                    // },
                  })}
                  type="number"
                  min="0"
                  // max={profile?.dailyGoal ? profile.dailyGoal * 3 : 100}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                  placeholder="0"
                />
                {errors.pagesRead && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.pagesRead.message}
                  </p>
                )}

                {profile && (
                  <div className="mt-2 text-xs text-slate-400">
                    <p>0 = Não leu</p>
                    <p>1-{Math.floor(profile.dailyGoal * 0.5)} = Pouco</p>
                    <p>
                      {Math.floor(profile.dailyGoal * 0.5) + 1}-
                      {profile.dailyGoal - 1} = Médio
                    </p>
                    <p>
                      {profile.dailyGoal}-{Math.floor(profile.dailyGoal * 1.5)}{" "}
                      = Muito
                    </p>
                    <p>{Math.floor(profile.dailyGoal * 1.5) + 1}+ = Intenso</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

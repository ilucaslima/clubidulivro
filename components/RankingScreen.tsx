"use client";

import { UserProfile } from "@/contexts/AuthContext";
import { DayContribution } from "@/lib/types";
import { useMemo, useState } from "react";

interface RankingScreenProps {
  members: UserProfile[];
  contributions: { [key: string]: DayContribution[] };
  currentUserId?: string;
  onBack: () => void;
}

export default function RankingScreen({
  members,
  contributions,
  currentUserId,
  onBack,
}: RankingScreenProps) {
  const [showMonthly, setShowMonthly] = useState(false);

  // Calcular ranking geral (todos os tempos)
  const generalRanking = useMemo(() => {
    return members
      .map((member) => {
        const totalContributions =
          contributions[member.id]?.filter((day) => day.level > 0).length || 0;
        const totalPages =
          contributions[member.id]?.reduce(
            (sum, day) => sum + (day.pagesRead || 0),
            0
          ) || 0;
        return {
          ...member,
          totalContributions,
          totalPages,
        };
      })
      .sort((a, b) => b.totalContributions - a.totalContributions);
  }, [members, contributions]);

  // Calcular ranking do mês atual
  const monthlyRanking = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return members
      .map((member) => {
        const monthlyContributions =
          contributions[member.id]?.filter((day) => {
            const dayDate = new Date(day.date);
            return (
              day.level > 0 &&
              dayDate.getMonth() === currentMonth &&
              dayDate.getFullYear() === currentYear
            );
          }).length || 0;

        const monthlyPages =
          contributions[member.id]?.reduce((sum, day) => {
            const dayDate = new Date(day.date);
            if (
              day.level > 0 &&
              dayDate.getMonth() === currentMonth &&
              dayDate.getFullYear() === currentYear
            ) {
              return sum + (day.pagesRead || 0);
            }
            return sum;
          }, 0) || 0;

        return {
          ...member,
          totalContributions: monthlyContributions,
          totalPages: monthlyPages,
        };
      })
      .sort((a, b) => b.totalContributions - a.totalContributions);
  }, [members, contributions]);

  const currentRanking = showMonthly ? monthlyRanking : generalRanking;
  const currentMonthName = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const top3 = currentRanking.slice(0, 3);
  const others = currentRanking.slice(3);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Voltar
            </button>
            <h1 className="text-2xl font-semibold">
              🏆 Ranking {showMonthly ? `de ${currentMonthName}` : "Geral"}
            </h1>
          </div>
        </div>

        {/* Botões para alternar entre geral e mensal */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setShowMonthly(false)}
            className={`px-6 py-3 text-lg font-medium transition-colors rounded-lg ${
              !showMonthly
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600"
            }`}
          >
            Geral
          </button>
          <div className="text-slate-600 text-xl">|</div>
          <button
            onClick={() => setShowMonthly(true)}
            className={`px-6 py-3 text-lg font-medium transition-colors rounded-lg ${
              showMonthly
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600"
            }`}
          >
            Mensal
          </button>
        </div>

        {currentRanking.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🏆</div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Nenhum progresso ainda
            </h2>
            <p className="text-slate-400">
              Comece a marcar seu progresso para aparecer no ranking!
            </p>
          </div>
        ) : (
          <>
            {/* Pódio */}
            {top3.length > 0 && (
              <div className="mb-16">
                {/* Cards dos Top 3 */}
                <div className="flex items-end justify-center gap-4 sm:gap-8 mb-12">
                  {/* 2º lugar */}
                  {top3[1] && (
                    <div className="relative">
                      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 border-2 border-slate-600 shadow-xl transform hover:scale-105 transition-transform min-w-[160px] text-center">
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-slate-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                            2
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-4xl mb-3">🥈</div>
                          <div className="font-bold text-lg text-white mb-2">
                            {top3[1].name}
                          </div>
                          <div className="text-sm text-slate-300 font-medium">
                            {top3[1].totalContributions} dias
                          </div>
                          <div className="text-xs text-slate-400">
                            {top3[1].totalPages} páginas
                          </div>
                          {top3[1].id === currentUserId && (
                            <div className="inline-block text-xs bg-green-600 text-white px-3 py-1 rounded-full mt-3 font-medium">
                              Você
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1º lugar */}
                  <div className="relative scale-110">
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-8 border-2 border-yellow-300 shadow-2xl transform hover:scale-105 transition-transform min-w-[180px] text-center">
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                          1
                        </div>
                      </div>
                      <div className="mt-6">
                        <div className="text-5xl mb-4">🏆</div>
                        <div className="font-bold text-xl text-yellow-900 mb-3">
                          {top3[0].name}
                        </div>
                        <div className="text-base text-yellow-800 font-bold">
                          {top3[0].totalContributions} dias
                        </div>
                        <div className="text-sm text-yellow-700">
                          {top3[0].totalPages} páginas
                        </div>
                        {top3[0].id === currentUserId && (
                          <div className="inline-block text-sm bg-green-600 text-white px-3 py-1 rounded-full mt-4 font-medium">
                            Você
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3º lugar */}
                  {top3[2] && (
                    <div className="relative">
                      <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-6 border-2 border-amber-500 shadow-xl transform hover:scale-105 transition-transform min-w-[160px] text-center">
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <div className="bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                            3
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="text-4xl mb-3">🥉</div>
                          <div className="font-bold text-lg text-white mb-2">
                            {top3[2].name}
                          </div>
                          <div className="text-sm text-amber-100 font-medium">
                            {top3[2].totalContributions} dias
                          </div>
                          <div className="text-xs text-amber-200">
                            {top3[2].totalPages} páginas
                          </div>
                          {top3[2].id === currentUserId && (
                            <div className="inline-block text-xs bg-green-600 text-white px-3 py-1 rounded-full mt-3 font-medium">
                              Você
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lista dos demais */}
            {others.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-6 text-center">
                  Outros Participantes
                </h3>
                <div className="space-y-3">
                  {others.map((member, index) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        member.id === currentUserId
                          ? "bg-green-900/30 border border-green-700"
                          : "bg-slate-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-600 text-lg font-medium">
                          {index + 4}º
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-lg">
                              {member.name}
                            </span>
                            {member.id === currentUserId && (
                              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-400">
                            📖 {member.book}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium text-white">
                          {member.totalContributions}{" "}
                          {member.totalContributions === 1 ? "dia" : "dias"}
                        </div>
                        <div className="text-sm text-slate-400">
                          {member.totalPages} páginas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

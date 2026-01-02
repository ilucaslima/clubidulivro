/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import AuthScreen from "@/components/AuthScreen";
import NewBookForm from "@/components/NewBookForm";
import DailyProgressModal from "@/components/DailyProgressModal";
import { CompletedBook, useAuth, UserProfile } from "@/contexts/AuthContext";
import {
  calculateDaysBetween,
  createDateFromDays,
  formatTooltipDate,
} from "@/lib/dateUtils";
import { db } from "@/lib/firebase";
import { getLevelClass, getMonthPositions } from "@/lib/gridUtils";
import { DayContribution } from "@/lib/types";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function ReadingGroup() {
  const { user, profile, signOut, loading } = useAuth();
  const [allMembers, setAllMembers] = useState<UserProfile[]>([]);
  const [contributions, setContributions] = useState<{
    [key: string]: DayContribution[];
  }>({});
  const [showModal, setShowModal] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const totalDays = calculateDaysBetween(startDate, today);
  const weeksToShow = Math.ceil(totalDays / 7);

  useEffect(() => {
    if (user) {
      loadMembersAndProgress();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadMembersAndProgress = async () => {
    if (loadingData) return;

    setLoadingData(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const members: UserProfile[] = [];

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          completedBooks: (data.completedBooks || []).map(
            (book: CompletedBook) => ({
              ...book,
              finishedAt: (book.finishedAt as any).toDate(),
            })
          ),
        } as UserProfile);
      });

      setAllMembers(members);

      // Busca todo o histórico de progresso do último ano, independente do livro.
      const progressSnapshot = await getDocs(
        query(collection(db, "progress"), orderBy("timestamp", "desc"))
      );

      const progressData: { [key: string]: DayContribution[] } = {};

      members.forEach((member) => {
        progressData[member.id] = [];

        for (let i = 0; i < totalDays; i++) {
          const currentDate = createDateFromDays(startDate, i);
          progressData[member.id].push({
            level: 0,
            date: currentDate,
          });
        }
      });

      progressSnapshot.forEach((doc) => {
        const data = doc.data();
        const userId = data.userId;
        const progressDate = new Date(data.date + "T00:00:00");

        if (progressData[userId]) {
          const dayIndex = Math.floor(
            (progressDate.getTime() - startDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (dayIndex >= 0 && dayIndex < totalDays) {
            progressData[userId][dayIndex] = {
              level: data.intensity,
              date: progressDate,
              pagesRead: Number(data.pagesRead) || 0,
            };
          }
        }
      });

      setContributions(progressData);
    } catch (error: any) {
      console.log(error)
    } finally {
      setLoadingData(false);
    }
  };

  const monthPositions = getMonthPositions(startDate, weeksToShow);

  const getRestPages = () => {
    const total = Number(profile?.totalPages) || 0
    const lidas = Number(profile?.currentBookPagesRead) || 0

    if (!profile) return "--"
    if (total <= 0) return "--"

    const faltam = Math.max(0, total - lidas)
    return faltam.toString().padStart(2, "0")
  }


  if (!user && !loading) {
    return <AuthScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg mb-2">Conectando...</div>
          <div className="text-slate-400 text-sm">
            Carregando seu clube de leitura
          </div>
        </div>
      </div>
    );
  }

  const handleDataUpdate = () => {
    loadMembersAndProgress();
  };

  if (profile && !profile.book) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold">📚 Clubi du Livro</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={signOut}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
          <NewBookForm onBookAdded={handleDataUpdate} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">📚 Clubi du Livro</h1>
          <div className="flex items-center gap-4">
            {profile && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Marcar progresso
              </button>
            )}
            <button
              onClick={signOut}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        {profile && (
          <div className="bg-slate-800 p-4 rounded-lg mb-8">
            <h2 className="text-lg font-medium mb-2">Seu progresso</h2>
            <div className="flex items-center gap-4 text-sm text-slate-300">
              <span>
                📖 <strong>{profile.book}</strong>
              </span>
              <span>📄 {profile.totalPages} páginas total</span>
              <span>🎯 Meta diária: {profile.dailyGoal} páginas</span>
              {profile.totalPages > 0 && (
                <span>
                  {`🏁 Faltam ${getRestPages()} páginas`}
                </span>
              )}
            </div>
          </div>
        )}

        {profile &&
          profile.completedBooks &&
          profile.completedBooks.length > 0 && (
            <div className="bg-slate-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">
                📚 Livros Concluídos
              </h2>
              <ul className="space-y-3">
                {profile.completedBooks.map((book, index) => (
                  <li
                    key={index}
                    className="bg-slate-700 p-3 rounded-md flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-white">{book.title}</p>
                      <p className="text-sm text-slate-400">
                        Terminado em:{" "}
                        {(book.finishedAt as Date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <p className="text-sm text-slate-300">
                      {book.totalPages} páginas
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {loadingData ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-slate-300 text-lg mb-2">
              Carregando membros...
            </div>
            <div className="text-slate-400 text-sm">
              Buscando dados do grupo
            </div>
          </div>
        ) : allMembers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📚</div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              Bem-vindo ao Clube!
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Você é o primeiro membro! Convide seus amigos para começarem a ler
              juntos. Marque seu primeiro progresso para aparecer no quadro.
            </p>
            <div className="bg-slate-800 p-6 rounded-lg max-w-sm mx-auto">
              <h3 className="text-lg font-medium text-white mb-3">
                Como começar:
              </h3>
              <ol className="text-sm text-slate-300 space-y-2 text-left">
                <li>1. 📖 Escolha seu livro (já feito!)</li>
                <li>2. 🎯 Defina sua meta diária (já calculada!)</li>
                <li>3. 📊 Clique em &quot;Marcar progresso&quot; acima</li>
                <li>4. 👥 Convide amigos para se juntarem</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {allMembers.map((member) => (
              <div key={member.id}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{member.name}</div>
                    {member.id === profile?.id && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    📖 {member.book} • Meta: {member.dailyGoal}pgs/dia
                  </div>
                </div>

                <div className="relative overflow-x-auto">
                  <div className="min-w-max">
                    <div className="relative mb-2 h-4">
                      {monthPositions.map(({ month, position }) => (
                        <div
                          key={`${month}-${position}`}
                          className="absolute text-xs text-slate-400"
                          style={{ left: `${position * 14 + 40}px` }}
                        >
                          {month}
                        </div>
                      ))}
                    </div>

                    <div className="flex">
                      <div className="flex flex-col text-xs text-slate-400 mr-2 shrink-0">
                        <div className="h-3 mb-0.5"></div>
                        <div className="h-3 mb-0.5 leading-3 text-right pr-1">
                          Seg
                        </div>
                        <div className="h-3 mb-0.5"></div>
                        <div className="h-3 mb-0.5 leading-3 text-right pr-1">
                          Qua
                        </div>
                        <div className="h-3 mb-0.5"></div>
                        <div className="h-3 mb-0.5 leading-3 text-right pr-1">
                          Sex
                        </div>
                        <div className="h-3 mb-0.5"></div>
                      </div>

                      <div className="inline-flex gap-0.5">
                        {Array.from({ length: weeksToShow }, (_, weekIndex) => (
                          <div
                            key={weekIndex}
                            className="flex flex-col gap-0.5"
                          >
                            {Array.from({ length: 7 }, (_, dayIndex) => {
                              const dayNumber = weekIndex * 7 + dayIndex;
                              const day = contributions[member.id]?.[dayNumber];
                              const currentDate = createDateFromDays(
                                startDate,
                                dayNumber
                              );
                              const tooltipText =
                                day && day.pagesRead
                                  ? `${formatTooltipDate(currentDate)} - ${
                                      day.pagesRead
                                    } páginas`
                                  : formatTooltipDate(currentDate);

                              return (
                                <div
                                  key={dayNumber}
                                  className={`w-3 h-3 rounded-sm hover:ring-1 hover:ring-slate-400 transition-all ${
                                    day
                                      ? getLevelClass(day.level)
                                      : "bg-gray-800"
                                  }`}
                                  title={tooltipText}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-8 text-xs text-slate-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-800"></div>
            <div className="w-3 h-3 rounded-sm bg-green-900"></div>
            <div className="w-3 h-3 rounded-sm bg-green-700"></div>
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
            <div className="w-3 h-3 rounded-sm bg-green-400"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <DailyProgressModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          handleDataUpdate();
        }}
      />
    </div>
  );
}

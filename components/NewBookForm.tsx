/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { useForm } from "react-hook-form";
import BookSearch from "./BookSearch";

interface NewBookFormProps {
  onBookAdded: () => void;
}

interface NewBookData {
  book: string;
  totalPages: number;
}

export default function NewBookForm({ onBookAdded }: NewBookFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewBookData>();

  const onSubmit = async (data: NewBookData) => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const dailyGoal = Math.ceil(Number(data.totalPages) / 30);
      await updateDoc(doc(db, "users", user.uid), {
        book: data.book,
        totalPages: Number(data.totalPages),
        dailyGoal,
        currentBookPagesRead: 0,
      });
      onBookAdded();
    } catch (e: any) {
      setError("Erro ao adicionar novo livro. Tente novamente.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = (book: { title: string; totalPages: number }) => {
    setValue("book", book.title);
    if (book.totalPages > 0) {
      setValue("totalPages", book.totalPages);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg max-w-md mx-auto my-8 border border-slate-700 shadow-xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Novo Ciclo! 📚</h2>
        <p className="text-slate-400 text-sm">
          Adicione seu próximo livro para continuar acompanhando seu progresso com a comunidade.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <BookSearch onSelect={handleBookSelect} label="Buscar na biblioteca" />

        <div className="pt-4 border-t border-slate-700 space-y-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dados do livro</p>
          
          <div>
            <label htmlFor="book" className="block text-sm font-medium text-slate-300 mb-2">
              Confirmar nome do livro
            </label>
            <input
              id="book"
              type="text"
              {...register("book", { required: "O nome do livro é obrigatório" })}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
              placeholder="Ex: A Guerra dos Tronos"
            />
            {errors.book && <p className="text-red-400 text-sm mt-1">{errors.book.message}</p>}
          </div>

          <div>
            <label htmlFor="totalPages" className="block text-sm font-medium text-slate-300 mb-2">
              Confirmar total de páginas
            </label>
            <input
              id="totalPages"
              type="number"
              min="1"
              {...register("totalPages", { 
                required: "O total de páginas é obrigatório", 
                valueAsNumber: true, 
                min: { value: 1, message: "Deve ter pelo menos 1 página" } 
              })}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
              placeholder="Ex: 800"
            />
            {errors.totalPages && <p className="text-red-400 text-sm mt-1">{errors.totalPages.message}</p>}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-bold py-4 px-4 rounded-md transition-all shadow-lg hover:shadow-green-500/20 active:scale-[0.98]"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Adicionando...
            </div>
          ) : (
            "Começar Leitura!"
          )}
        </button>
      </form>
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { useForm } from "react-hook-form";

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
      console.log(e)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg max-w-md mx-auto my-8">
      <h2 className="text-xl font-semibold text-white mb-2">Parabéns!</h2>
      <p className="text-slate-300 mb-4">
        Você terminou seu livro. Adicione um novo para continuar seu progresso.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div>
          <label htmlFor="book" className="block text-sm font-medium text-slate-300 mb-2">
            Nome do novo livro
          </label>
          <input
            id="book"
            type="text"
            {...register("book", { required: "O nome do livro é obrigatório" })}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
            placeholder="A Guerra dos Tronos"
          />
          {errors.book && <p className="text-red-400 text-sm mt-1">{errors.book.message}</p>}
        </div>
        <div>
          <label htmlFor="totalPages" className="block text-sm font-medium text-slate-300 mb-2">
            Total de páginas
          </label>
          <input
            id="totalPages"
            type="number"
            min="1"
            {...register("totalPages", { required: "O total de páginas é obrigatório", valueAsNumber: true, min: { value: 1, message: "Deve ter pelo menos 1 página" } })}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
            placeholder="800"
          />
          {errors.totalPages && <p className="text-red-400 text-sm mt-1">{errors.totalPages.message}</p>}
        </div>
        <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white font-medium py-3 px-4 rounded-md transition-colors">
          {loading ? "Adicionando..." : "Adicionar Livro"}
        </button>
      </form>
    </div>
  );
}
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    pageCount?: number;
    imageLinks?: {
      thumbnail: string;
    };
  };
}

interface BookSearchProps {
  onSelect: (book: { title: string; totalPages: number }) => void;
  label?: string;
}

export default function BookSearch({ onSelect, label = "Buscar livro" }: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=pt,en`
        );
        const data = await response.json();
        setResults(data.items || []);
        setShowDropdown(true);
      } catch (error) {
        console.error("Erro ao buscar livros:", error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (book: GoogleBook) => {
    onSelect({
      title: book.volumeInfo.title,
      totalPages: book.volumeInfo.pageCount || 0,
    });
    setQuery(book.volumeInfo.title);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 3 && setShowDropdown(true)}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
          placeholder="Ex: O Hobbit, Harry Potter..."
        />
        {loading && (
          <div className="absolute right-3 top-3.5">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl max-h-60 overflow-y-auto">
          {results.map((book) => (
            <button
              key={book.id}
              type="button"
              onClick={() => handleSelect(book)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors text-left border-b border-slate-700 last:border-0"
            >
              {book.volumeInfo.imageLinks?.thumbnail && (
                <div className="relative w-10 h-14 shrink-0">
                  <Image
                    src={book.volumeInfo.imageLinks.thumbnail.replace("http://", "https://")}
                    alt={book.volumeInfo.title}
                    fill
                    className="object-cover rounded"
                    sizes="40px"
                  />
                </div>
              )}
              <div>
                <div className="text-white font-medium text-sm line-clamp-1">
                  {book.volumeInfo.title}
                </div>
                <div className="text-slate-400 text-xs">
                  {book.volumeInfo.authors?.join(", ") || "Autor desconhecido"}
                </div>
                <div className="text-slate-500 text-xs">
                  {book.volumeInfo.pageCount ? `${book.volumeInfo.pageCount} páginas` : "Páginas não informadas"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

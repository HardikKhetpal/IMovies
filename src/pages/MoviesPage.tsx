import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, RefreshCw, Film } from 'lucide-react';
import { Movie } from '../types.ts';
import { api } from '../api/client.ts';
import { MovieCard } from '../components/MovieCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface MoviesPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialParams?: { search?: string; genre?: string; city?: string };
}

export const MoviesPage: React.FC<MoviesPageProps> = ({ onNavigate, initialParams }) => {
  const { selectedCity } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(initialParams?.search || '');
  const [genre, setGenre] = useState(initialParams?.genre || 'All');
  const [language, setLanguage] = useState('All');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('rating');

  const genres = ['All', 'Action', 'Sci-Fi', 'Drama', 'Adventure', 'Biography', 'Romance', 'Documentary', 'Mystery'];
  const languages = ['All', 'English', 'Japanese'];

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (genre !== 'All') params.append('genre', genre);
      if (language !== 'All') params.append('language', language);
      if (status !== 'All') params.append('status', status);
      if (selectedCity !== 'All') params.append('city', selectedCity);
      params.append('sort', sort);

      const res = await api.get<{ movies: Movie[] }>(`/movies?${params.toString()}`);
      setMovies(res.movies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [genre, language, status, sort, selectedCity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies();
  };

  const handleResetFilters = () => {
    setSearch('');
    setGenre('All');
    setLanguage('All');
    setStatus('All');
    setSort('rating');
  };

  const hasActiveFilters = search || genre !== 'All' || language !== 'All' || status !== 'All';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Movie Discoveries</h1>
          <p className="text-xs text-gray-400 mt-1">
            Browse and reserve tickets for all titles showing across partner cinema theatres
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, actor, or director..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#12151c] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e50914]"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#e50914] text-white rounded-xl text-xs font-bold hover:bg-[#b80710] transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="p-4 rounded-2xl bg-[#12151c] border border-white/10 space-y-4">
        {/* Genre Tags Scrollable Row */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-gray-400 flex items-center space-x-1 flex-shrink-0 mr-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#e50914]" />
            <span>Genre:</span>
          </span>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition ${
                genre === g
                  ? 'bg-[#e50914] text-white shadow-md'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Secondary Filters: Language, Status, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Language */}
            <div className="flex items-center space-x-1.5">
              <span className="text-gray-400">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-[#181d26] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-1.5">
              <span className="text-gray-400">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-[#181d26] border border-white/10 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none"
              >
                <option value="All">All Releases</option>
                <option value="now_showing">Now Showing</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
            </div>

            {/* Reset button if active filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 text-gray-400 hover:text-white transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-[#181d26] border border-white/10 text-white rounded-lg px-3 py-1 text-xs focus:outline-none"
            >
              <option value="rating">Highest Rating</option>
              <option value="releaseDate">Latest Release</option>
              <option value="title">Title (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="py-24 text-center text-gray-500 bg-[#12151c] rounded-2xl border border-white/5">
          <Film className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-bold text-white">No Movies Match Your Filter Criteria</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
            Try adjusting your search query, selecting "All Genres", or picking another cinema location.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-6 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onSelect={(id) => onNavigate('movie-details', { id })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Film, Sparkles, MapPin, ChevronRight, Award, Compass, Play } from 'lucide-react';
import { Movie, Theatre } from '../types.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { HeroBanner } from '../components/HeroBanner.tsx';
import { MovieCard } from '../components/MovieCard.tsx';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { selectedCity } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'now_showing' | 'coming_soon'>('now_showing');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [moviesRes, theatresRes] = await Promise.all([
          api.get<{ movies: Movie[] }>(`/movies?city=${selectedCity}`),
          api.get<Theatre[]>(`/theatres?city=${selectedCity}`)
        ]);
        setMovies(moviesRes.movies || []);
        setTheatres(theatresRes || []);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCity]);

  const nowShowing = movies.filter((m) => m.status === 'now_showing');
  const comingSoon = movies.filter((m) => m.status === 'coming_soon');
  const displayedMovies = activeTab === 'now_showing' ? nowShowing : comingSoon;

  const genres = ['Action', 'Sci-Fi', 'Drama', 'Adventure', 'Biography', 'Romance', 'Mystery', 'Documentary'];

  return (
    <div className="space-y-16 pb-20">
      {/* Cinematic Hero Banner */}
      {nowShowing.length > 0 && (
        <HeroBanner
          movies={nowShowing}
          onBookMovie={(id) => onNavigate('movie-details', { id })}
          onMovieDetails={(id) => onNavigate('movie-details', { id })}
        />
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Now Showing & Coming Soon Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('now_showing')}
                className={`text-xl sm:text-2xl font-black transition ${
                  activeTab === 'now_showing' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Now Showing
                {activeTab === 'now_showing' && (
                  <span className="block h-1 w-8 bg-[#e50914] rounded-full mt-1" />
                )}
              </button>

              <span className="text-gray-600 text-xl font-bold">/</span>

              <button
                onClick={() => setActiveTab('coming_soon')}
                className={`text-xl sm:text-2xl font-black transition ${
                  activeTab === 'coming_soon' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Coming Soon
                {activeTab === 'coming_soon' && (
                  <span className="block h-1 w-8 bg-amber-500 rounded-full mt-1" />
                )}
              </button>
            </div>

            <button
              onClick={() => onNavigate('movies')}
              className="flex items-center space-x-1 text-xs font-bold text-[#e50914] hover:text-[#b80710] group"
            >
              <span>Explore All Films</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Movies Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : displayedMovies.length === 0 ? (
            <div className="py-16 text-center text-gray-500 bg-[#12151c] rounded-2xl border border-white/5 mt-6">
              <Film className="w-12 h-12 mx-auto text-gray-600 mb-3" />
              <p className="text-base font-bold text-white">No films matching this selection</p>
              <p className="text-xs text-gray-400 mt-1">Try switching to all locations or browsing all titles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {displayedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSelect={(id) => onNavigate('movie-details', { id })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Browse By Genre Cards */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Explore by Genre</h2>
              <p className="text-xs text-gray-400 mt-1">Find your favorite cinema flavor</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => onNavigate('movies', { genre: g })}
                className="p-4 rounded-xl bg-[#12151c] hover:bg-[#181d26] border border-white/10 hover:border-[#e50914]/50 text-center transition group flex flex-col items-center justify-center space-y-2"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-[#e50914] group-hover:bg-[#e50914]/10 transition">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-gray-200 group-hover:text-white">{g}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Cinemas Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Featured Cinema Locations</h2>
              <p className="text-xs text-gray-400 mt-1">
                State-of-the-art auditoriums with IMAX, Dolby Atmos, and Gourmet Concessions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {theatres.slice(0, 3).map((theatre) => (
              <div
                key={theatre.id}
                className="p-6 rounded-2xl bg-[#12151c] border border-white/10 hover:border-white/20 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600/10 text-[#e50914] border border-red-600/20">
                      {theatre.city}
                    </span>
                    <span className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>Open Today</span>
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-base mt-3">{theatre.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{theatre.address}</p>

                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {theatre.facilities.map((fac) => (
                      <span key={fac} className="px-2 py-0.5 rounded-md bg-white/5 text-gray-300 text-[11px] border border-white/5">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('movies', { city: theatre.city })}
                  className="mt-6 w-full py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition text-center"
                >
                  View Scheduled Shows
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

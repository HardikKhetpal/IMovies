import React, { useState, useEffect } from 'react';
import { Star, Clock, Calendar, Film, MapPin, Play, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { Movie, Show, Theatre } from '../types.ts';
import { api } from '../api/client.ts';
import { useBooking } from '../context/BookingContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface MovieDetailsPageProps {
  movieId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const MovieDetailsPage: React.FC<MovieDetailsPageProps> = ({ movieId, onNavigate }) => {
  const { selectedCity } = useAuth();
  const { setSelectedShow, clearSeatSelection } = useBooking();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);

  // Generate 3 date tabs: Today, Tomorrow, Day After
  const dates = [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      offset,
      dateString: d.toISOString().slice(0, 10),
      label: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      formatted: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
    };
  });

  const selectedDate = dates[selectedDateIndex].dateString;

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const [movieRes, showsRes, theatresRes] = await Promise.all([
          api.get<{ movie: Movie }>(`/movies/${movieId}`),
          api.get<Show[]>(`/shows?movieId=${movieId}&date=${selectedDate}${selectedCity !== 'All' ? `&city=${selectedCity}` : ''}`),
          api.get<Theatre[]>('/theatres')
        ]);

        setMovie(movieRes.movie || null);
        setShows(showsRes || []);
        setTheatres(theatresRes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId, selectedDate, selectedCity]);

  const handleSelectShowtime = (show: Show) => {
    clearSeatSelection();
    setSelectedShow(show);
    onNavigate('seat-selection', { showId: show.id });
  };

  if (loading && !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-400">Loading film details & showtimes...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">
        <Film className="w-12 h-12 mx-auto text-gray-600 mb-2" />
        <p className="text-base font-bold text-white">Movie not found</p>
        <button
          onClick={() => onNavigate('movies')}
          className="mt-4 px-4 py-2 rounded-xl bg-[#e50914] text-white text-xs font-semibold"
        >
          Return to Movies
        </button>
      </div>
    );
  }

  // Group shows by Theatre
  const showsByTheatre = theatres
    .map((theatre) => {
      const theatreShows = shows.filter((s) => s.theatreId === theatre.id);
      return {
        theatre,
        shows: theatreShows
      };
    })
    .filter((group) => group.shows.length > 0);

  return (
    <div className="space-y-12 pb-24">
      {/* Movie Hero Header with Backdrop */}
      <div className="relative w-full bg-[#12151c] border-b border-white/10 overflow-hidden">
        {/* Backdrop Graphic */}
        <div className="absolute inset-0">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center opacity-25 filter blur-sm brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0f] via-[#0a0c0f]/80 to-transparent" />
        </div>

        {/* Content Details */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster Card */}
            <div className="w-48 sm:w-60 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-[#181d26]">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Synopsis & Metadata */}
            <div className="space-y-4 flex-grow">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#e50914] text-white text-xs font-bold uppercase tracking-wider">
                  {movie.contentRating}
                </span>
                <span className="px-2.5 py-1 rounded bg-black/60 border border-white/10 text-gray-200 text-xs font-semibold">
                  {movie.language}
                </span>
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.rating.toFixed(1)} / 10 IMDb</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">{movie.title}</h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300">
                <span>{movie.genre.join(', ')}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>Released {new Date(movie.releaseDate).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed max-w-3xl pt-2">
                {movie.description}
              </p>

              {/* Cast & Director */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-400 font-semibold">Director:</span>
                  <span className="text-white font-medium">{movie.director}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-gray-400 font-semibold">Starring:</span>
                  {movie.cast.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-200">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Showtime Selection Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Date Selector Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white">Select Cinema & Showtime</h2>
            <p className="text-xs text-gray-400 mt-1">
              Choose your preferred date, auditorium format, and time slot
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-[#12151c] p-1.5 rounded-2xl border border-white/10">
            {dates.map((d, idx) => (
              <button
                key={d.dateString}
                onClick={() => setSelectedDateIndex(idx)}
                className={`px-4 py-2 rounded-xl text-center transition ${
                  idx === selectedDateIndex
                    ? 'bg-[#e50914] text-white font-bold shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="block text-xs uppercase tracking-wider">{d.label}</span>
                <span className="block text-[11px] font-medium opacity-80">{d.formatted}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Shows grouped by Theatres */}
        {showsByTheatre.length === 0 ? (
          <div className="py-16 text-center text-gray-500 bg-[#12151c] rounded-2xl border border-white/5">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-600 mb-2" />
            <h4 className="text-base font-bold text-white">No Shows Available for this Date / Location</h4>
            <p className="text-xs text-gray-400 mt-1">
              Try picking another day or selecting "All Locations" from the top navigation.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {showsByTheatre.map(({ theatre, shows: tShows }) => (
              <div
                key={theatre.id}
                className="p-6 rounded-2xl bg-[#12151c] border border-white/10 space-y-4"
              >
                {/* Theatre Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/5">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-bold text-base">{theatre.name}</h3>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300">
                        {theatre.city}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center space-x-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      <span>{theatre.address}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {theatre.facilities.map((fac) => (
                      <span key={fac} className="px-2 py-0.5 rounded bg-white/5 text-[11px] text-gray-300">
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Showtimes Grid */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-3">
                    Available Show Timings
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {tShows.map((s) => {
                      const startTime = new Date(s.startTime);
                      const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                      return (
                        <button
                          key={s.id}
                          onClick={() => handleSelectShowtime(s)}
                          className="group p-3 rounded-xl bg-[#181d26] hover:bg-[#e50914] border border-white/10 hover:border-[#e50914] transition text-center flex flex-col items-center justify-center space-y-1 shadow-sm"
                        >
                          <span className="text-sm font-bold text-white group-hover:scale-105 transition-transform">
                            {timeStr}
                          </span>
                          <span className="text-[10px] text-emerald-400 group-hover:text-white font-medium">
                            From ₹{s.baseTicketPrice}
                          </span>
                          <span className="text-[9px] text-gray-400 group-hover:text-white/80 truncate max-w-[100px]">
                            {s.screen?.screenName || 'Audi 1'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Film, MapPin, Calendar, Clock, RefreshCw } from 'lucide-react';
import { Show, ShowSeat } from '../types.ts';
import { api } from '../api/client.ts';
import { useBooking } from '../context/BookingContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { SeatMap } from '../components/SeatMap.tsx';

interface SeatSelectionPageProps {
  showId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const SeatSelectionPage: React.FC<SeatSelectionPageProps> = ({ showId, onNavigate }) => {
  const { isAuthenticated } = useAuth();
  const { setSelectedShow } = useBooking();
  const [show, setShow] = useState<Show | null>(null);
  const [seats, setSeats] = useState<ShowSeat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeats = async () => {
    try {
      const res = await api.get<{ show: Show; seats: ShowSeat[] }>(`/shows/${showId}/seats`);
      setShow(res.show);
      setSeats(res.seats || []);
      setSelectedShow(res.show);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, [showId]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#e50914]/20 border border-[#e50914]/30 flex items-center justify-center mx-auto text-[#e50914]">
          <Film className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In Required to Reserve Seats</h2>
        <p className="text-xs text-gray-400">
          Please sign in to securely lock your selected seats and complete your booking.
        </p>
        <button
          onClick={() => onNavigate('login', { redirect: 'seat-selection', showId })}
          className="px-6 py-3 rounded-xl bg-[#e50914] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#b80710] shadow-lg shadow-red-600/30 transition"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  if (loading || !show) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-400">Loading auditorium layout and live seat availability...</p>
      </div>
    );
  }

  const startTime = new Date(show.startTime);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-20">
      {/* Top Breadcrumb & Show Details Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onNavigate('movie-details', { id: show.movieId })}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
            title="Back to Movie"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{show.movie?.title}</h1>
              <span className="px-2 py-0.5 rounded bg-[#e50914] text-white text-[10px] font-bold">
                {show.movie?.contentRating}
              </span>
            </div>
            <p className="text-xs text-gray-400 flex flex-wrap items-center gap-2 mt-1">
              <span>{show.theatre?.name}</span>
              <span>•</span>
              <span>{show.screen?.screenName}</span>
              <span>•</span>
              <span className="text-gray-300 font-medium">
                {startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })},{' '}
                {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={fetchSeats}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Availability</span>
        </button>
      </div>

      {/* Seat Map Core */}
      <SeatMap
        show={show}
        seats={seats}
        onRefreshSeats={fetchSeats}
        onProceedToCheckout={() => onNavigate('checkout')}
      />
    </div>
  );
};

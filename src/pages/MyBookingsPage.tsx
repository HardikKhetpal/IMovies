import React, { useState, useEffect } from 'react';
import { Ticket, Calendar, Clock, MapPin, QrCode, AlertTriangle, CheckCircle2, XCircle, ArrowLeft, X } from 'lucide-react';
import { Booking } from '../types.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface MyBookingsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Change of plans');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.get<Booking[]>('/bookings/my');
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;

    setCancellingId(cancelModalBooking.id);
    setActionMessage(null);

    try {
      await api.post(`/bookings/${cancelModalBooking.id}/cancel`, {
        reason: cancelReason
      });

      setActionMessage({
        type: 'success',
        text: `Booking ${cancelModalBooking.bookingReference} cancelled successfully. Full refund initiated.`
      });
      setCancelModalBooking(null);
      fetchBookings();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Unable to cancel booking.'
      });
    } finally {
      setCancellingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    return b.bookingStatus === filter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">My Movie Bookings</h1>
          <p className="text-xs text-gray-400 mt-1">
            Access digital tickets, review show dates, or manage upcoming cinema reservations
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 bg-[#12151c] p-1.5 rounded-xl border border-white/10 self-start sm:self-auto text-xs">
          {(['all', 'confirmed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[11px] transition ${
                filter === tab
                  ? 'bg-[#e50914] text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-400">Loading your tickets...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-24 text-center bg-[#12151c] rounded-2xl border border-white/5 space-y-4">
          <Ticket className="w-12 h-12 mx-auto text-gray-600" />
          <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You don't have any {filter !== 'all' ? filter : ''} bookings at the moment. Browse the latest blockbusters and reserve your favorite seats!
          </p>
          <button
            onClick={() => onNavigate('movies')}
            className="px-6 py-2.5 rounded-xl bg-[#e50914] text-white text-xs font-bold hover:bg-[#b80710] transition"
          >
            Explore Movies
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const show = b.show;
            const startTime = show ? new Date(show.startTime) : new Date(b.createdAt);
            const isConfirmed = b.bookingStatus === 'confirmed';
            const canCancel = isConfirmed && startTime.getTime() - Date.now() > 2 * 60 * 60 * 1000;

            return (
              <div
                key={b.id}
                className="p-6 rounded-2xl bg-[#12151c] border border-white/10 hover:border-white/20 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                {/* Left: Poster + Film Info */}
                <div className="flex items-start space-x-4">
                  {show?.movie?.posterUrl ? (
                    <img
                      src={show.movie.posterUrl}
                      alt={show.movie.title}
                      className="w-16 h-24 object-cover rounded-xl shadow-md border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 flex-shrink-0">
                      <Ticket className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-amber-400">{b.bookingReference}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isConfirmed
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{show?.movie?.title || 'Cinema Movie'}</h3>
                    <p className="text-xs text-gray-400 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-[#e50914]" />
                      <span>{show?.theatre?.name} • {show?.screen?.screenName}</span>
                    </p>

                    <div className="flex items-center space-x-3 text-xs text-gray-300 pt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>{startTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <span className="text-xs text-gray-400">Seats:</span>
                      <div className="flex flex-wrap gap-1">
                        {b.seats.map((s) => (
                          <span key={s.seatId} className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">
                            {s.rowLabel}{s.seatNumber}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Price & Actions */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-end justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Paid</span>
                    <span className="text-lg font-black text-white">₹{b.totalAmount}</span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      onClick={() => setSelectedTicket(b)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Ticket</span>
                    </button>

                    {canCancel && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="px-3 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-xs font-semibold border border-red-600/20 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Digital Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#12151c] border border-white/20 overflow-hidden shadow-2xl">
            <div className="p-6 bg-gradient-to-r from-[#181d26] to-[#1a202c] border-b border-dashed border-white/20 flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#e50914] uppercase">IMovies E-Ticket</span>
                <h3 className="text-xl font-black text-white mt-0.5">{selectedTicket.show?.movie?.title}</h3>
                <p className="text-xs text-amber-400 font-mono font-bold">Ref: {selectedTicket.bookingReference}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400 text-[10px] block">Cinema</span>
                  <p className="text-white font-bold">{selectedTicket.show?.theatre?.name}</p>
                  <p className="text-gray-400 text-[11px]">{selectedTicket.show?.screen?.screenName}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Date & Time</span>
                  <p className="text-white font-bold">
                    {new Date(selectedTicket.show?.startTime || '').toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-emerald-400 font-bold">
                    {new Date(selectedTicket.show?.startTime || '').toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5">
                <span className="text-gray-400 text-[10px] block mb-1">Seats Assigned</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTicket.seats.map((s) => (
                    <span key={s.seatId} className="px-2.5 py-1 rounded bg-[#e50914] text-white font-bold text-xs">
                      {s.rowLabel}{s.seatNumber} ({s.seatType.toUpperCase()})
                    </span>
                  ))}
                </div>
              </div>

              {/* QR Code */}
              <div className="pt-4 border-t border-white/10 text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-32 h-32 rounded-2xl bg-white p-3 flex items-center justify-center shadow-lg">
                  <QrCode className="w-full h-full text-black" />
                </div>
                <p className="text-[11px] text-gray-400 font-mono">Present at cinema scanner for instant gate clearance</p>
              </div>
            </div>

            <div className="p-4 bg-[#0a0c0f] border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl bg-[#12151c] border border-red-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-base font-bold text-white">Cancel Cinema Booking?</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to cancel booking{' '}
              <strong className="text-amber-400">{cancelModalBooking.bookingReference}</strong> for{' '}
              <strong className="text-white">{cancelModalBooking.show?.movie?.title}</strong>?
            </p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Refund Amount:</span>
                <span className="font-bold text-white">₹{cancelModalBooking.totalAmount} (100% Full Refund)</span>
              </div>
              <div className="flex justify-between">
                <span>Release Seats:</span>
                <span>{cancelModalBooking.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ')}</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-[#181d26] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none"
              >
                <option value="Change of plans">Change of plans / Schedule conflict</option>
                <option value="Accidental booking">Accidental reservation</option>
                <option value="Prefer different time or theatre">Prefer different time or theatre</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancellingId !== null}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30"
              >
                {cancellingId ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

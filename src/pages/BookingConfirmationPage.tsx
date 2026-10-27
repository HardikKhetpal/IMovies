import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Ticket, Printer, ArrowRight, Home, Calendar, Clock, MapPin, QrCode } from 'lucide-react';
import { Booking } from '../types.ts';
import { api } from '../api/client.ts';
import { useBooking } from '../context/BookingContext.tsx';

interface BookingConfirmationPageProps {
  bookingId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const BookingConfirmationPage: React.FC<BookingConfirmationPageProps> = ({ bookingId, onNavigate }) => {
  const { clearBooking } = useBooking();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 }
    });

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await api.get<Booking>(`/bookings/${bookingId}`);
        setBooking(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();

    // Clean active booking state
    clearBooking();
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="w-10 h-10 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-gray-400">Finalizing ticket reservation...</p>
      </div>
    );
  }

  const show = booking.show;
  const startTime = show ? new Date(show.startTime) : new Date();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Success Badge Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Booking Confirmed!</h1>
        <p className="text-xs text-gray-400">
          We have emailed your confirmation and e-ticket. Present this digital ticket at the theatre entrance.
        </p>
      </div>

      {/* The Printable Cinema E-Ticket Card */}
      <div className="rounded-3xl bg-[#12151c] border border-white/15 overflow-hidden shadow-2xl relative">
        {/* Ticket Header Notch Cutouts Graphic */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#181d26] to-[#1a202c] border-b border-dashed border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#e50914]">Official IMovies E-Ticket</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                VERIFIED PAID
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">{show?.movie?.title || 'Blockbuster Movie'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Ref: <span className="text-amber-400 font-mono font-bold">{booking.bookingReference}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Amount</span>
            <span className="text-xl font-black text-white">₹{booking.totalAmount}</span>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          {/* Cinema Location */}
          <div className="space-y-1">
            <span className="text-gray-400 text-[11px] flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-[#e50914]" />
              <span>Cinema & Auditorium</span>
            </span>
            <p className="text-white font-bold text-sm">{show?.theatre?.name}</p>
            <p className="text-gray-400 text-[11px]">{show?.screen?.screenName}</p>
            <p className="text-gray-500 text-[10px]">{show?.theatre?.address}</p>
          </div>

          {/* Date & Time */}
          <div className="space-y-1">
            <span className="text-gray-400 text-[11px] flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Show Schedule</span>
            </span>
            <p className="text-white font-bold text-sm">
              {startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-emerald-400 font-bold flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </p>
          </div>

          {/* Seats Info */}
          <div className="space-y-1">
            <span className="text-gray-400 text-[11px] flex items-center space-x-1">
              <Ticket className="w-3.5 h-3.5 text-amber-400" />
              <span>Allocated Seats ({booking.seats.length})</span>
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {booking.seats.map((s) => (
                <span key={s.seatId} className="px-2 py-0.5 rounded bg-[#e50914] text-white font-black text-xs">
                  {s.rowLabel}{s.seatNumber}
                </span>
              ))}
            </div>
            <p className="text-gray-400 text-[10px] pt-1">
              Category: {booking.seats[0]?.seatType.toUpperCase() || 'STANDARD'}
            </p>
          </div>
        </div>

        {/* QR Code & Barcode Gate Scanning Section */}
        <div className="p-6 sm:p-8 bg-[#0a0c0f] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            {/* Simulated QR Code box */}
            <div className="w-24 h-24 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg">
              <div className="w-full h-full bg-black rounded-lg flex items-center justify-center text-white font-mono text-[9px] text-center p-1 font-bold">
                <QrCode className="w-16 h-16 text-white" />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-white font-bold">Contactless Auditorium Entry</p>
              <p className="text-gray-400 text-[11px] leading-relaxed max-w-xs">
                Scan this code at the ticket scanner or show reference{' '}
                <strong className="text-amber-400">{booking.bookingReference}</strong> to usher staff.
              </p>
              <span className="text-[10px] text-gray-500 block">ID verification may be requested at entry.</span>
            </div>
          </div>

          {/* Action: Print */}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={() => onNavigate('my-bookings')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2"
        >
          <span>View My Bookings</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onNavigate('home')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#e50914] hover:bg-[#b80710] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition flex items-center justify-center space-x-2"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};

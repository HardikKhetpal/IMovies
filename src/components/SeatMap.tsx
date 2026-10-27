import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Check, Lock, Armchair, AlertCircle } from 'lucide-react';
import { Show, ShowSeat } from '../types.ts';
import { useBooking } from '../context/BookingContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface SeatMapProps {
  show: Show;
  seats: ShowSeat[];
  onRefreshSeats: () => void;
  onProceedToCheckout: () => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({ show, seats, onRefreshSeats, onProceedToCheckout }) => {
  const { user } = useAuth();
  const { selectedSeats, toggleSeat, clearSeatSelection, lockSelectedSeats, heldSeats, holdExpiresAt } = useBooking();
  const [locking, setLocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Real-time Server-Sent Events (SSE) listener for this show
  useEffect(() => {
    const eventSource = new EventSource(`/api/events/seats/${show.id}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SEATS_HELD' || data.type === 'SEATS_RELEASED' || data.type === 'SEATS_BOOKED') {
          onRefreshSeats();
        }
      } catch (err) {
        // Ignore parsing errors
      }
    };

    return () => {
      eventSource.close();
    };
  }, [show.id]);

  // Countdown timer for held seats
  useEffect(() => {
    if (!holdExpiresAt) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = holdExpiresAt - Date.now();
      if (remainingMs <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        onRefreshSeats();
      } else {
        setTimeLeft(Math.floor(remainingMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  const handleHoldAndProceed = async () => {
    setErrorMessage('');
    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat to proceed.');
      return;
    }

    setLocking(true);
    const result = await lockSelectedSeats();
    setLocking(false);

    if (result.success) {
      onProceedToCheckout();
    } else {
      setErrorMessage(result.message || 'Selected seats could not be held. Please refresh and pick alternative seats.');
      onRefreshSeats();
    }
  };

  // Group seats by category and row
  const recliners = seats.filter((s) => s.seatType === 'recliner');
  const premium = seats.filter((s) => s.seatType === 'premium');
  const standard = seats.filter((s) => s.seatType === 'standard');

  const groupRows = (seatList: ShowSeat[]) => {
    const map = new Map<string, ShowSeat[]>();
    seatList.forEach((s) => {
      if (!map.has(s.rowLabel)) map.set(s.rowLabel, []);
      map.get(s.rowLabel)!.push(s);
    });
    // Sort rows alphabetically
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const renderSeatRow = (rowLabel: string, rowSeats: ShowSeat[]) => {
    // Sort seats by number
    const sorted = [...rowSeats].sort((a, b) => a.seatNumber - b.seatNumber);

    return (
      <div key={rowLabel} className="flex items-center justify-center space-x-2 sm:space-x-3 my-2">
        <span className="w-6 text-xs font-bold text-gray-500 text-right select-none">{rowLabel}</span>

        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {sorted.map((seat) => {
            const isSelected = selectedSeats.some((s) => s.id === seat.id);
            const isHeldByMe = seat.status === 'locked' && seat.lockedBy === user?.id;
            const isHeldByOther = seat.status === 'locked' && seat.lockedBy !== user?.id;
            const isBooked = seat.status === 'booked';

            let seatClasses = 'bg-white/5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:scale-110';

            if (isBooked) {
              seatClasses = 'bg-gray-800/60 border-white/5 text-gray-600 cursor-not-allowed opacity-50';
            } else if (isHeldByOther) {
              seatClasses = 'bg-amber-500/20 border-amber-500/60 text-amber-300 cursor-not-allowed';
            } else if (isSelected || isHeldByMe) {
              seatClasses = 'bg-[#e50914] border-[#e50914] text-white font-bold scale-110 shadow-lg shadow-red-600/40';
            }

            return (
              <button
                key={seat.id}
                disabled={isBooked || isHeldByOther}
                onClick={() => toggleSeat(seat)}
                title={`${seat.rowLabel}${seat.seatNumber} • ${seat.seatType.toUpperCase()} • ₹${seat.price}`}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-[11px] font-semibold flex items-center justify-center transition-all duration-150 select-none ${seatClasses}`}
              >
                {isBooked ? (
                  <span className="text-[10px]">✕</span>
                ) : isHeldByOther ? (
                  <Lock className="w-3 h-3 text-amber-400" />
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  seat.seatNumber
                )}
              </button>
            );
          })}
        </div>

        <span className="w-6 text-xs font-bold text-gray-500 text-left select-none">{rowLabel}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Timer Bar if seats held */}
      {timeLeft !== null && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-amber-400 animate-spin" />
            <div>
              <p className="text-xs font-bold text-white">Seats Temporarily Reserved</p>
              <p className="text-[11px] text-gray-400">Complete checkout before the reservation timer lapses.</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-mono font-black text-amber-400">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {/* Screen Curved Line Graphic */}
      <div className="py-6 text-center">
        <div className="screen-curve mb-3" />
        <p className="text-[11px] font-bold tracking-[0.25em] text-gray-500 uppercase">
          Eyes Facing Curved Silver Screen
        </p>
      </div>

      {/* Seat Category Matrices */}
      <div className="space-y-6 overflow-x-auto pb-4">
        {/* Recliner VIP Section */}
        {recliners.length > 0 && (
          <div className="bg-[#12151c]/60 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                <Armchair className="w-4 h-4" />
                <span className="uppercase tracking-wider">VIP Recliner Lounge (Row E-F)</span>
              </div>
              <span className="text-xs font-bold text-white">₹{show.pricing.recliner} / ticket</span>
            </div>
            {groupRows(recliners).map(([row, rSeats]) => renderSeatRow(row, rSeats))}
          </div>
        )}

        {/* Premium Section */}
        {premium.length > 0 && (
          <div className="bg-[#12151c]/60 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Prime Center Stage (Row C-D)
              </span>
              <span className="text-xs font-bold text-white">₹{show.pricing.premium} / ticket</span>
            </div>
            {groupRows(premium).map(([row, rSeats]) => renderSeatRow(row, rSeats))}
          </div>
        )}

        {/* Standard Section */}
        {standard.length > 0 && (
          <div className="bg-[#12151c]/60 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Classic Standard (Row A-B)
              </span>
              <span className="text-xs font-bold text-white">₹{show.pricing.standard} / ticket</span>
            </div>
            {groupRows(standard).map(([row, rSeats]) => renderSeatRow(row, rSeats))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 py-4 px-6 rounded-2xl bg-[#12151c] border border-white/10 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded border border-emerald-500/50 bg-emerald-500/10" />
          <span className="text-gray-300">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-[#e50914] text-white flex items-center justify-center text-[10px]">✓</div>
          <span className="text-gray-300">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
            <Lock className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-gray-300">Held (Active Lock)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-gray-800 border border-white/5 flex items-center justify-center text-[10px] text-gray-500">✕</div>
          <span className="text-gray-500">Sold Out</span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Selected Seats Floating Bar */}
      <div className="bg-[#181d26] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Selected:</span>
            {selectedSeats.length === 0 ? (
              <span className="text-xs text-gray-500 italic">No seats selected (Max 8)</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((s) => (
                  <span key={s.id} className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-xs">
                    {s.rowLabel}{s.seatNumber}
                  </span>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Authoritative prices include convenience fees & taxes at checkout.
          </p>
        </div>

        <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
          {selectedSeats.length > 0 && (
            <div className="text-right">
              <span className="text-xs text-gray-400">Est. Total:</span>
              <p className="text-lg font-black text-white">
                ₹{selectedSeats.reduce((sum, s) => sum + s.price, 0)}
              </p>
            </div>
          )}

          <button
            onClick={handleHoldAndProceed}
            disabled={selectedSeats.length === 0 || locking}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-[#e50914] hover:bg-[#b80710] disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all"
          >
            {locking ? 'Holding Seats...' : `Lock Seats & Continue (${selectedSeats.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

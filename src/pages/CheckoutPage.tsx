import React, { useState } from 'react';
import { ArrowLeft, Ticket, ShieldCheck, CreditCard, Sparkles, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { useBooking } from '../context/BookingContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../api/client.ts';

interface CheckoutPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const {
    selectedShow,
    heldSeats,
    amountBreakdown,
    totalAmount,
    snacks,
    snacksTotal,
    grandTotal,
    updateSnackQuantity,
    createBookingOrder,
    setCurrentBooking
  } = useBooking();

  const [paymentProvider, setPaymentProvider] = useState<'demo' | 'razorpay'>('demo');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!selectedShow || heldSeats.length === 0 || !amountBreakdown) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <Ticket className="w-12 h-12 mx-auto text-gray-600 mb-2" />
        <h2 className="text-xl font-bold text-white">No Active Reservation Found</h2>
        <p className="text-xs text-gray-400">
          Your temporary hold may have expired or no seats were chosen. Please select your seats again.
        </p>
        <button
          onClick={() => onNavigate('movies')}
          className="px-6 py-2.5 rounded-xl bg-[#e50914] text-white text-xs font-bold hover:bg-[#b80710] transition"
        >
          Browse Shows
        </button>
      </div>
    );
  }

  const handlePay = async () => {
    setProcessing(true);
    setErrorMessage('');

    try {
      // 1. Create booking order
      const booking = await createBookingOrder();

      // 2. Initialize payment order
      const orderRes = await api.post<{
        provider: string;
        orderId: string;
        amount: number;
        bookingId: string;
      }>('/payments/create-order', {
        bookingId: booking.id
      });

      // 3. Complete payment verification
      const verifyRes = await api.post<{
        bookingStatus: string;
        paymentStatus: string;
      }>('/payments/verify', {
        bookingId: booking.id,
        orderId: orderRes.orderId,
        paymentId: `PAY_DEMO_${Date.now()}`
      });

      setCurrentBooking({ ...booking, bookingStatus: 'confirmed', paymentStatus: 'paid' });
      onNavigate('confirmation', { bookingId: booking.id });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing error');
    } finally {
      setProcessing(false);
    }
  };

  const startTime = new Date(selectedShow.startTime);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Top Header */}
      <div className="flex items-center space-x-4 pb-4 border-b border-white/10">
        <button
          onClick={() => onNavigate('seat-selection', { showId: selectedShow.id })}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">Order Summary & Checkout</h1>
          <p className="text-xs text-gray-400">Confirm ticket selection, add gourmet snacks, and complete payment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tickets & Gourmet Concessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cinema & Show Details Card */}
          <div className="p-6 rounded-2xl bg-[#12151c] border border-white/10 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e50914] bg-red-600/10 px-2 py-0.5 rounded border border-red-600/20">
                  {selectedShow.movie?.contentRating}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedShow.movie?.title}</h3>
                <p className="text-xs text-gray-400">{selectedShow.theatre?.name} • {selectedShow.screen?.screenName}</p>
                <p className="text-xs text-gray-300 font-medium mt-1">
                  {startTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })},{' '}
                  {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-gray-400">Reserved Seats ({heldSeats.length})</span>
                <div className="flex flex-wrap gap-1 mt-1 justify-end">
                  {heldSeats.map((s) => (
                    <span key={s.id} className="px-2 py-0.5 rounded bg-[#e50914] text-white font-bold text-xs">
                      {s.rowLabel}{s.seatNumber}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Gourmet Concession Snack Add-ons */}
          <div className="p-6 rounded-2xl bg-[#12151c] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Pre-order Gourmet Concessions</span>
                </h3>
                <p className="text-xs text-gray-400">Skip the intermission line with in-seat concession delivery</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {snacks.map((snack) => (
                <div
                  key={snack.id}
                  className="p-3 rounded-xl bg-[#181d26] border border-white/5 flex flex-col justify-between space-y-3"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black/40">
                    <img src={snack.image} alt={snack.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{snack.name}</h5>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{snack.description}</p>
                    <span className="text-xs font-bold text-amber-400 mt-2 block">₹{snack.price}</span>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[11px] text-gray-400">Qty:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateSnackQuantity(snack.id, -1)}
                        disabled={snack.quantity === 0}
                        className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white flex items-center justify-center text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-white w-4 text-center">{snack.quantity}</span>
                      <button
                        onClick={() => updateSnackQuantity(snack.id, 1)}
                        className="w-6 h-6 rounded bg-[#e50914] hover:bg-[#b80710] text-white flex items-center justify-center text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Contact Details */}
          <div className="p-6 rounded-2xl bg-[#12151c] border border-white/10 space-y-3">
            <h4 className="text-sm font-bold text-white">Ticket Delivery Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-400 block text-[10px]">Name</span>
                <span className="text-white font-medium">{user?.name}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-400 block text-[10px]">Email (E-Ticket Recipient)</span>
                <span className="text-white font-medium truncate block">{user?.email}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-400 block text-[10px]">Mobile Number</span>
                <span className="text-white font-medium">{user?.phone || '+91 98765 43210'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown & Payment Options */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#181d26] border border-white/10 space-y-6 shadow-xl">
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">Payment Breakdown</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>Tickets Subtotal ({heldSeats.length} seats)</span>
                <span className="font-semibold text-white">₹{amountBreakdown.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Convenience Fee (10%)</span>
                <span>₹{amountBreakdown.convenienceFee}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Integrated GST (18% on fee)</span>
                <span>₹{amountBreakdown.tax}</span>
              </div>
              {snacksTotal > 0 && (
                <div className="flex justify-between text-amber-400 pt-1 border-t border-white/5">
                  <span>Concessions & Snacks</span>
                  <span className="font-bold">₹{snacksTotal}</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-sm">
                <span className="text-white font-bold">Grand Total Amount</span>
                <span className="text-xl font-black text-[#e50914]">₹{grandTotal}</span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Payment Method
              </span>

              <div className="space-y-2">
                <label
                  onClick={() => setPaymentProvider('demo')}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                    paymentProvider === 'demo'
                      ? 'bg-red-600/10 border-[#e50914]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentProvider"
                    checked={paymentProvider === 'demo'}
                    onChange={() => setPaymentProvider('demo')}
                    className="mt-1 text-[#e50914] focus:ring-[#e50914]"
                  />
                  <div>
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>Demo Sandbox Simulator</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                        Recommended
                      </span>
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Simulates instantaneous bank authorization, zero real charge, instant ticket confirmation.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentProvider('razorpay')}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                    paymentProvider === 'razorpay'
                      ? 'bg-red-600/10 border-[#e50914]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentProvider"
                    checked={paymentProvider === 'razorpay'}
                    onChange={() => setPaymentProvider('razorpay')}
                    className="mt-1 text-[#e50914] focus:ring-[#e50914]"
                  />
                  <div>
                    <span className="text-xs font-bold text-white">Razorpay Standard / UPI Gateway</span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Production payment router supporting Cards, UPI, NetBanking, and Wallets.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-4 rounded-xl bg-[#e50914] hover:bg-[#b80710] disabled:bg-gray-800 disabled:text-gray-600 text-white font-extrabold text-sm uppercase tracking-wider shadow-xl shadow-red-600/40 hover:scale-[1.02] transition-all flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>{processing ? 'Authorizing Payment...' : `Pay ₹${grandTotal} & Confirm`}</span>
            </button>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>256-Bit Encrypted TLS Bank Gateway</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

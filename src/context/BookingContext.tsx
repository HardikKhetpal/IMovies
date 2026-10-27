import React, { createContext, useContext, useState, useEffect } from 'react';
import { Show, ShowSeat, Booking } from '../types.ts';
import { api } from '../api/client.ts';

export interface SnackItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
}

const DEFAULT_SNACKS: SnackItem[] = [
  {
    id: 'snk-1',
    name: 'Caramel & Butter Popcorn Tub (Large)',
    description: 'Freshly popped jumbo corn with sweet golden caramel and melted butter.',
    price: 320,
    quantity: 0,
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'snk-2',
    name: 'Loaded Mexican Cheese Nachos',
    description: 'Crisp tortilla chips served with warm jalapeño cheese sauce and tangy salsa.',
    price: 260,
    quantity: 0,
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?q=80&w=300&auto=format&fit=crop'
  },
  {
    id: 'snk-3',
    name: 'Chilled Pepsi Zero Sugar (Double Cup)',
    description: 'Ice-cold carbonated beverage in souvenir collector cups.',
    price: 180,
    quantity: 0,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=300&auto=format&fit=crop'
  }
];

interface BookingContextType {
  selectedShow: Show | null;
  selectedSeats: ShowSeat[];
  heldSeats: ShowSeat[];
  holdExpiresAt: number | null;
  amountBreakdown: {
    subtotal: number;
    convenienceFee: number;
    tax: number;
  } | null;
  totalAmount: number;
  snacks: SnackItem[];
  snacksTotal: number;
  grandTotal: number;
  currentBooking: Booking | null;
  setSelectedShow: (show: Show | null) => void;
  toggleSeat: (seat: ShowSeat) => void;
  clearSeatSelection: () => void;
  lockSelectedSeats: () => Promise<{ success: boolean; message?: string }>;
  releaseLockedSeats: () => Promise<void>;
  updateSnackQuantity: (id: string, delta: number) => void;
  createBookingOrder: () => Promise<Booking>;
  setCurrentBooking: (booking: Booking | null) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<ShowSeat[]>([]);
  const [heldSeats, setHeldSeats] = useState<ShowSeat[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [amountBreakdown, setAmountBreakdown] = useState<{ subtotal: number; convenienceFee: number; tax: number } | null>(null);
  const [snacks, setSnacks] = useState<SnackItem[]>(DEFAULT_SNACKS);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  // Seat toggle logic
  const toggleSeat = (seat: ShowSeat) => {
    if (seat.status !== 'available') return;

    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        if (prev.length >= 8) {
          return prev;
        }
        return [...prev, seat];
      }
    });
  };

  const clearSeatSelection = () => {
    setSelectedSeats([]);
  };

  // Hold selected seats via API with 5-min TTL
  const lockSelectedSeats = async (): Promise<{ success: boolean; message?: string }> => {
    if (!selectedShow || selectedSeats.length === 0) {
      return { success: false, message: 'Please select at least one seat.' };
    }

    try {
      const res = await api.post<{
        heldSeats: ShowSeat[];
        amountBreakdown: { subtotal: number; convenienceFee: number; tax: number };
        totalAmount: number;
        holdExpiresInSeconds: number;
      }>('/bookings/hold', {
        showId: selectedShow.id,
        seatIds: selectedSeats.map((s) => s.id)
      });

      setHeldSeats(res.heldSeats);
      setAmountBreakdown(res.amountBreakdown);
      setHoldExpiresAt(Date.now() + res.holdExpiresInSeconds * 1000);

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to hold seats' };
    }
  };

  // Release held seats
  const releaseLockedSeats = async () => {
    if (selectedShow && heldSeats.length > 0) {
      try {
        await api.post('/bookings/release', {
          showId: selectedShow.id,
          seatIds: heldSeats.map((s) => s.id)
        });
      } catch (err) {
        // Ignore
      }
    }
    setHeldSeats([]);
    setSelectedSeats([]);
    setHoldExpiresAt(null);
    setAmountBreakdown(null);
  };

  // Snacks management
  const updateSnackQuantity = (id: string, delta: number) => {
    setSnacks((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const newQty = Math.max(0, Math.min(10, s.quantity + delta));
          return { ...s, quantity: newQty };
        }
        return s;
      })
    );
  };

  const snacksTotal = snacks.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const ticketTotal = amountBreakdown
    ? amountBreakdown.subtotal + amountBreakdown.convenienceFee + amountBreakdown.tax
    : 0;
  const grandTotal = ticketTotal + snacksTotal;

  // Initialize booking order
  const createBookingOrder = async (): Promise<Booking> => {
    if (!selectedShow || heldSeats.length === 0) {
      throw new Error('No held seats available for booking.');
    }

    const booking = await api.post<Booking>('/bookings', {
      showId: selectedShow.id,
      seatIds: heldSeats.map((s) => s.id)
    });

    setCurrentBooking(booking);
    return booking;
  };

  const clearBooking = () => {
    setSelectedShow(null);
    setSelectedSeats([]);
    setHeldSeats([]);
    setHoldExpiresAt(null);
    setAmountBreakdown(null);
    setSnacks(DEFAULT_SNACKS);
    setCurrentBooking(null);
  };

  // Auto clean when expired
  useEffect(() => {
    if (!holdExpiresAt) return;

    const timer = setInterval(() => {
      if (Date.now() > holdExpiresAt) {
        setHeldSeats([]);
        setHoldExpiresAt(null);
        setAmountBreakdown(null);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [holdExpiresAt]);

  return (
    <BookingContext.Provider
      value={{
        selectedShow,
        selectedSeats,
        heldSeats,
        holdExpiresAt,
        amountBreakdown,
        totalAmount: ticketTotal,
        snacks,
        snacksTotal,
        grandTotal,
        currentBooking,
        setSelectedShow,
        toggleSeat,
        clearSeatSelection,
        lockSelectedSeats,
        releaseLockedSeats,
        updateSnackQuantity,
        createBookingOrder,
        setCurrentBooking,
        clearBooking
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

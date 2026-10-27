export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string;
  genre: string[];
  language: string;
  duration: number; // in minutes
  releaseDate: string;
  cast: string[];
  director: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  rating: number;
  contentRating: 'U' | 'UA' | 'A' | 'R' | 'PG-13';
  status: 'now_showing' | 'coming_soon' | 'archived';
  createdAt: string;
}

export interface Theatre {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  facilities: string[];
  isActive: boolean;
  createdAt: string;
}

export interface Screen {
  id: string;
  theatreId: string;
  screenName: string;
  totalSeats: number;
  isActive: boolean;
  seatRows: {
    row: string;
    seatCount: number;
    seatType: 'standard' | 'premium' | 'recliner';
  }[];
}

export interface Show {
  id: string;
  movieId: string;
  theatreId: string;
  screenId: string;
  startTime: string;
  endTime: string;
  baseTicketPrice: number;
  pricing: {
    standard: number;
    premium: number;
    recliner: number;
  };
  status: 'scheduled' | 'running' | 'completed' | 'cancelled';
  movie?: Movie;
  theatre?: Theatre;
  screen?: Screen;
}

export interface ShowSeat {
  id: string;
  showId: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: 'standard' | 'premium' | 'recliner';
  price: number;
  status: 'available' | 'locked' | 'booked';
  lockedBy?: string | null;
  lockedAt?: string | null;
  bookingId?: string | null;
}

export interface BookingSeat {
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: 'standard' | 'premium' | 'recliner';
  price: number;
}

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  showId: string;
  seats: BookingSeat[];
  amountBreakdown: {
    subtotal: number;
    convenienceFee: number;
    tax: number;
  };
  totalAmount: number;
  bookingStatus: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'failed';
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  show?: Show | null;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  } | null;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'system' | 'cancellation';
  isRead: boolean;
  createdAt: string;
}

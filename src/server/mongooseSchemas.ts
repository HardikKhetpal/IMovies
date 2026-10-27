/**
 * Mongoose Models Reference for IMovies Cinema Ticket Booking Platform
 * These models define MongoDB collections for production MERN deployment.
 */
import mongoose from 'mongoose';

// User Schema
export const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  profileImage: { type: String, default: '' }
}, { timestamps: true });

// Movie Schema
export const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  genre: [{ type: String, index: true }],
  language: { type: String, index: true },
  duration: { type: Number, required: true },
  releaseDate: { type: Date, required: true },
  cast: [{ type: String }],
  director: { type: String, required: true },
  posterUrl: { type: String, required: true },
  backdropUrl: { type: String, default: '' },
  trailerUrl: { type: String, default: '' },
  rating: { type: Number, default: 8.5 },
  contentRating: { type: String, enum: ['U', 'UA', 'A', 'R', 'PG-13'], default: 'UA' },
  status: { type: String, enum: ['now_showing', 'coming_soon', 'archived'], default: 'now_showing' }
}, { timestamps: true });

// Theatre Schema
export const TheatreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true },
  facilities: [{ type: String }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Screen Schema
export const ScreenSchema = new mongoose.Schema({
  theatreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true, index: true },
  screenName: { type: String, required: true },
  totalSeats: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Physical Seat Schema
export const SeatSchema = new mongoose.Schema({
  screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true, index: true },
  rowLabel: { type: String, required: true },
  seatNumber: { type: Number, required: true },
  seatType: { type: String, enum: ['standard', 'premium', 'recliner'], default: 'standard' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
SeatSchema.index({ screenId: 1, rowLabel: 1, seatNumber: 1 }, { unique: true });

// Show Schema
export const ShowSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
  theatreId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true, index: true },
  screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true },
  baseTicketPrice: { type: Number, required: true },
  pricing: {
    standard: { type: Number, required: true },
    premium: { type: Number, required: true },
    recliner: { type: Number, required: true }
  },
  status: { type: String, enum: ['scheduled', 'running', 'completed', 'cancelled'], default: 'scheduled' }
}, { timestamps: true });

// ShowSeat Inventory Schema (Maintains atomic per-show availability)
export const ShowSeatSchema = new mongoose.Schema({
  showId: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
  rowLabel: { type: String, required: true },
  seatNumber: { type: Number, required: true },
  seatType: { type: String, enum: ['standard', 'premium', 'recliner'], required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['available', 'locked', 'booked'], default: 'available', index: true },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  lockedAt: { type: Date, default: null },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }
}, { timestamps: true });
ShowSeatSchema.index({ showId: 1, seatId: 1 }, { unique: true });

// Booking Schema
export const BookingSchema = new mongoose.Schema({
  bookingReference: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  showId: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
  seats: [{
    seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
    rowLabel: { type: String, required: true },
    seatNumber: { type: Number, required: true },
    seatType: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  amountBreakdown: {
    subtotal: { type: Number, required: true },
    convenienceFee: { type: Number, required: true },
    tax: { type: Number, required: true }
  },
  totalAmount: { type: Number, required: true },
  bookingStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending', index: true },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded', 'failed'], default: 'unpaid' },
  cancelledAt: { type: Date, default: null },
  cancellationReason: { type: String, default: null }
}, { timestamps: true });

// Payment Schema
export const PaymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentProvider: { type: String, enum: ['demo', 'razorpay'], required: true },
  providerOrderId: { type: String },
  providerPaymentId: { type: String },
  providerSignature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'successful', 'failed', 'refunded'], default: 'created' }
}, { timestamps: true });

// Notification Schema
export const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['booking', 'system', 'cancellation'], default: 'booking' },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

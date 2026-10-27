import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db.ts';
import { AuthenticatedRequest, generateToken, requireAuth, requireAdmin } from './auth.ts';
import { seatBroadcaster } from './sse.ts';
import { Movie, Show, BookingSeat, Booking, PaymentRecord, NotificationRecord } from './types.ts';

export const router = Router();

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

router.post('/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = db.createUser({
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    phone: phone ? phone.trim() : '',
    role: 'customer',
    createdAt: new Date().toISOString()
  });

  const token = generateToken(newUser);

  // Welcome notification
  db.createNotification({
    id: `notif-${Date.now()}`,
    userId: newUser.id,
    title: 'Welcome to IMovies!',
    message: 'Explore blockbuster films, reserve premium seats, and enjoy a seamless booking experience.',
    type: 'system',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  const safeUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
    createdAt: newUser.createdAt
  };

  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(201).json({
    success: true,
    message: 'Account created successfully!',
    data: { user: safeUser, token }
  });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const match = bcrypt.compareSync(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = generateToken(user);

  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt
  };

  return res.status(200).json({
    success: true,
    message: 'Signed in successfully!',
    data: { user: safeUser, token }
  });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('accessToken');
  return res.status(200).json({ success: true, message: 'Signed out successfully.' });
});

router.get('/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const safeUser = {
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    role: req.user.role,
    createdAt: req.user.createdAt
  };

  return res.status(200).json({ success: true, data: { user: safeUser } });
});

router.post('/auth/update-profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { name, phone } = req.body;
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const updated = db.updateUser(req.user.id, {
    name: name ? name.trim() : req.user.name,
    phone: phone ? phone.trim() : req.user.phone
  });

  return res.status(200).json({ success: true, data: { user: updated } });
});

// ==========================================
// 2. MOVIES ENDPOINTS
// ==========================================

router.get('/movies', (req, res) => {
  const { search, genre, language, status, city, sort = 'rating', page = '1', limit = '12' } = req.query;

  let movies = db.getMovies();

  // Search filter
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    movies = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.cast.some((c) => c.toLowerCase().includes(q))
    );
  }

  // Genre filter
  if (genre && typeof genre === 'string' && genre !== 'All') {
    movies = movies.filter((m) => m.genre.some((g) => g.toLowerCase() === genre.toLowerCase()));
  }

  // Language filter
  if (language && typeof language === 'string' && language !== 'All') {
    movies = movies.filter((m) => m.language.toLowerCase() === language.toLowerCase());
  }

  // Status filter (now_showing, coming_soon)
  if (status && typeof status === 'string') {
    movies = movies.filter((m) => m.status === status);
  }

  // City filter (movies showing in theatres of that city)
  if (city && typeof city === 'string' && city !== 'All') {
    const shows = db.getShows({ city });
    const movieIdsInCity = Array.from(new Set(shows.map((s) => s.movieId)));
    movies = movies.filter((m) => movieIdsInCity.includes(m.id));
  }

  // Sorting
  movies = [...movies].sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'releaseDate') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    if (sort === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  // Pagination
  const p = Math.max(1, parseInt(page as string, 10) || 1);
  const l = Math.max(1, parseInt(limit as string, 10) || 12);
  const total = movies.length;
  const paginated = movies.slice((p - 1) * l, p * l);

  return res.status(200).json({
    success: true,
    data: {
      movies: paginated,
      pagination: {
        total,
        page: p,
        pages: Math.ceil(total / l),
        limit: l
      }
    }
  });
});

router.get('/movies/:id', (req, res) => {
  const movie = db.findMovieById(req.params.id);
  if (!movie) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }

  // Also include active shows for this movie
  const shows = db.getShows({ movieId: movie.id });
  const theatres = db.getTheatres();

  const enrichedShows = shows.map((s) => {
    const theatre = theatres.find((t) => t.id === s.theatreId);
    const screen = db.findScreenById(s.screenId);
    return {
      ...s,
      theatre,
      screen
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      movie,
      shows: enrichedShows
    }
  });
});

router.post('/movies', requireAdmin, (req, res) => {
  const { title, description, genre, language, duration, releaseDate, cast, director, posterUrl, backdropUrl, trailerUrl, rating, contentRating, status } = req.body;

  if (!title || !description || !duration || !posterUrl || !director) {
    return res.status(400).json({ success: false, message: 'Title, description, duration, director, and poster URL are required.' });
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

  const newMovie: Movie = {
    id: `mov-${Date.now()}`,
    title: title.trim(),
    slug,
    description: description.trim(),
    genre: Array.isArray(genre) ? genre : (genre || 'Action').split(',').map((g: string) => g.trim()),
    language: language || 'English',
    duration: Number(duration),
    releaseDate: releaseDate || new Date().toISOString().slice(0, 10),
    cast: Array.isArray(cast) ? cast : (cast || '').split(',').map((c: string) => c.trim()).filter(Boolean),
    director: director.trim(),
    posterUrl: posterUrl.trim(),
    backdropUrl: backdropUrl?.trim() || posterUrl.trim(),
    trailerUrl: trailerUrl?.trim() || '',
    rating: Number(rating) || 8.0,
    contentRating: contentRating || 'UA',
    status: status || 'now_showing',
    createdAt: new Date().toISOString()
  };

  db.createMovie(newMovie);

  return res.status(201).json({ success: true, message: 'Movie added successfully!', data: newMovie });
});

router.put('/movies/:id', requireAdmin, (req, res) => {
  const updated = db.updateMovie(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }
  return res.status(200).json({ success: true, message: 'Movie updated successfully!', data: updated });
});

router.delete('/movies/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteMovie(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Movie not found.' });
  }
  return res.status(200).json({ success: true, message: 'Movie deleted successfully.' });
});

// ==========================================
// 3. THEATRES & SCREENS ENDPOINTS
// ==========================================

router.get('/theatres', (req, res) => {
  const { city } = req.query;
  let theatres = db.getTheatres();

  if (city && typeof city === 'string' && city !== 'All') {
    theatres = theatres.filter((t) => t.city.toLowerCase() === city.toLowerCase());
  }

  return res.status(200).json({ success: true, data: theatres });
});

router.get('/theatres/:id', (req, res) => {
  const theatre = db.findTheatreById(req.params.id);
  if (!theatre) {
    return res.status(404).json({ success: false, message: 'Theatre not found.' });
  }
  const screens = db.getScreens(theatre.id);
  return res.status(200).json({ success: true, data: { theatre, screens } });
});

router.post('/theatres', requireAdmin, (req, res) => {
  const { name, address, city, state, facilities } = req.body;
  if (!name || !address || !city) {
    return res.status(400).json({ success: false, message: 'Name, address, and city are required.' });
  }

  const theatre = db.createTheatre({
    id: `th-${Date.now()}`,
    name: name.trim(),
    address: address.trim(),
    city: city.trim(),
    state: state?.trim() || '',
    facilities: Array.isArray(facilities) ? facilities : ['Dolby Atmos', '4K Projection', 'Cafe'],
    isActive: true,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ success: true, data: theatre });
});

router.get('/screens', (req, res) => {
  const { theatreId } = req.query;
  const screens = db.getScreens(typeof theatreId === 'string' ? theatreId : undefined);
  return res.status(200).json({ success: true, data: screens });
});

// ==========================================
// 4. SHOWS & LIVE SEATS ENDPOINTS
// ==========================================

router.get('/shows', (req, res) => {
  const { movieId, theatreId, city, date } = req.query;
  const shows = db.getShows({
    movieId: typeof movieId === 'string' ? movieId : undefined,
    theatreId: typeof theatreId === 'string' ? theatreId : undefined,
    city: typeof city === 'string' ? city : undefined,
    date: typeof date === 'string' ? date : undefined
  });

  // Enrich with movie, theatre, and screen metadata
  const enriched = shows.map((s) => ({
    ...s,
    movie: db.findMovieById(s.movieId),
    theatre: db.findTheatreById(s.theatreId),
    screen: db.findScreenById(s.screenId)
  }));

  return res.status(200).json({ success: true, data: enriched });
});

router.get('/shows/:id', (req, res) => {
  const show = db.findShowById(req.params.id);
  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found.' });
  }

  const movie = db.findMovieById(show.movieId);
  const theatre = db.findTheatreById(show.theatreId);
  const screen = db.findScreenById(show.screenId);

  return res.status(200).json({
    success: true,
    data: {
      ...show,
      movie,
      theatre,
      screen
    }
  });
});

router.get('/shows/:id/seats', (req, res) => {
  const show = db.findShowById(req.params.id);
  if (!show) {
    return res.status(404).json({ success: false, message: 'Show not found.' });
  }

  const movie = db.findMovieById(show.movieId);
  const theatre = db.findTheatreById(show.theatreId);
  const screen = db.findScreenById(show.screenId);
  const seats = db.getShowSeats(show.id);

  return res.status(200).json({
    success: true,
    data: {
      show: {
        ...show,
        movie,
        theatre,
        screen
      },
      seats
    }
  });
});

router.post('/shows', requireAdmin, (req, res) => {
  const { movieId, theatreId, screenId, startTime, baseTicketPrice, pricing } = req.body;

  if (!movieId || !theatreId || !screenId || !startTime || !baseTicketPrice) {
    return res.status(400).json({ success: false, message: 'Missing required show parameters.' });
  }

  const movie = db.findMovieById(movieId);
  if (!movie) return res.status(404).json({ success: false, message: 'Movie not found.' });

  const start = new Date(startTime);
  const end = new Date(start.getTime() + movie.duration * 60 * 1000);
  const base = Number(baseTicketPrice);

  const newShow: Show = {
    id: `shw-${Date.now()}`,
    movieId,
    theatreId,
    screenId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    baseTicketPrice: base,
    pricing: pricing || {
      standard: base,
      premium: Math.round(base * 1.35),
      recliner: Math.round(base * 1.8)
    },
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };

  db.createShow(newShow);

  return res.status(201).json({ success: true, message: 'Show scheduled successfully!', data: newShow });
});

router.delete('/shows/:id', requireAdmin, (req, res) => {
  const deleted = db.deleteShow(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Show not found.' });
  }
  return res.status(200).json({ success: true, message: 'Show deleted successfully.' });
});

// ==========================================
// 5. SEAT LOCKING, BOOKINGS & CANCELLATIONS
// ==========================================

router.post('/bookings/hold', requireAuth, (req: AuthenticatedRequest, res) => {
  const { showId, seatIds } = req.body;
  const user = req.user!;

  if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Show ID and at least one seat selection are required.' });
  }

  if (seatIds.length > 8) {
    return res.status(400).json({ success: false, message: 'Maximum 8 seats can be reserved per transaction.' });
  }

  const lockResult = db.holdSeats(showId, seatIds, user.id);
  if (!lockResult.success) {
    return res.status(409).json({ success: false, message: lockResult.error });
  }

  // Calculate authoritative subtotal
  const subtotal = lockResult.heldSeats!.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(subtotal * 0.10); // 10% fee
  const tax = Math.round(convenienceFee * 0.18); // 18% GST on convenience fee
  const totalAmount = subtotal + convenienceFee + tax;

  // Broadcast real-time seat update to other connected users viewing this show
  seatBroadcaster.broadcast(showId, {
    type: 'SEATS_HELD',
    payload: {
      showId,
      seatIds,
      userId: user.id
    }
  });

  return res.status(200).json({
    success: true,
    message: 'Seats locked for 5 minutes.',
    data: {
      heldSeats: lockResult.heldSeats,
      amountBreakdown: {
        subtotal,
        convenienceFee,
        tax
      },
      totalAmount,
      holdExpiresInSeconds: 300
    }
  });
});

router.post('/bookings/release', requireAuth, (req: AuthenticatedRequest, res) => {
  const { showId, seatIds } = req.body;
  const user = req.user!;

  if (showId && Array.isArray(seatIds)) {
    db.releaseHeldSeats(showId, seatIds, user.id);
    seatBroadcaster.broadcast(showId, {
      type: 'SEATS_RELEASED',
      payload: { showId, seatIds }
    });
  }

  return res.status(200).json({ success: true, message: 'Held seats released.' });
});

router.post('/bookings', requireAuth, (req: AuthenticatedRequest, res) => {
  const { showId, seatIds } = req.body;
  const user = req.user!;

  if (!showId || !Array.isArray(seatIds) || seatIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Show ID and seat IDs required.' });
  }

  const show = db.findShowById(showId);
  if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });

  // Verify that the user currently holds these seats
  const currentSeats = db.getShowSeats(showId).filter((s) => seatIds.includes(s.id));
  if (currentSeats.length !== seatIds.length) {
    return res.status(400).json({ success: false, message: 'Some selected seats are invalid.' });
  }

  const notHeldByUser = currentSeats.find((s) => s.status !== 'locked' || s.lockedBy !== user.id);
  if (notHeldByUser) {
    return res.status(400).json({
      success: false,
      message: 'Your seat hold has expired or seats were reserved by another customer. Please select again.'
    });
  }

  // Authoritative price calculations
  const bookingSeats: BookingSeat[] = currentSeats.map((s) => ({
    seatId: s.id,
    rowLabel: s.rowLabel,
    seatNumber: s.seatNumber,
    seatType: s.seatType,
    price: s.price
  }));

  const subtotal = bookingSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = Math.round(subtotal * 0.10);
  const tax = Math.round(convenienceFee * 0.18);
  const totalAmount = subtotal + convenienceFee + tax;

  const bookingRef = 'IMOV-' + crypto.randomBytes(3).toString('hex').toUpperCase();

  const newBooking: Booking = {
    id: `bk-${Date.now()}`,
    bookingReference: bookingRef,
    userId: user.id,
    showId,
    seats: bookingSeats,
    amountBreakdown: {
      subtotal,
      convenienceFee,
      tax
    },
    totalAmount,
    bookingStatus: 'pending',
    paymentStatus: 'unpaid',
    createdAt: new Date().toISOString()
  };

  db.createBooking(newBooking);

  return res.status(201).json({
    success: true,
    message: 'Booking order initiated. Proceed to payment.',
    data: newBooking
  });
});

router.get('/bookings/my', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const bookings = db.getBookings(user.id);

  // Enrich with movie and theatre details
  const enriched = bookings.map((b) => {
    const show = db.findShowById(b.showId);
    const movie = show ? db.findMovieById(show.movieId) : null;
    const theatre = show ? db.findTheatreById(show.theatreId) : null;
    const screen = show ? db.findScreenById(show.screenId) : null;

    return {
      ...b,
      show: show ? { ...show, movie, theatre, screen } : null
    };
  });

  return res.status(200).json({ success: true, data: enriched });
});

router.get('/bookings/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const booking = db.findBookingById(req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  // Ensure customer cannot inspect another user's booking
  if (user.role !== 'admin' && booking.userId !== user.id) {
    return res.status(403).json({ success: false, message: 'Forbidden. You do not own this booking.' });
  }

  const show = db.findShowById(booking.showId);
  const movie = show ? db.findMovieById(show.movieId) : null;
  const theatre = show ? db.findTheatreById(show.theatreId) : null;
  const screen = show ? db.findScreenById(show.screenId) : null;
  const customer = db.findUserById(booking.userId);

  return res.status(200).json({
    success: true,
    data: {
      ...booking,
      customer: customer ? { name: customer.name, email: customer.email, phone: customer.phone } : null,
      show: show ? { ...show, movie, theatre, screen } : null
    }
  });
});

router.post('/bookings/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const booking = db.findBookingById(req.params.id);

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  if (user.role !== 'admin' && booking.userId !== user.id) {
    return res.status(403).json({ success: false, message: 'You are not authorized to cancel this booking.' });
  }

  if (booking.bookingStatus === 'cancelled') {
    return res.status(400).json({ success: false, message: 'This booking is already cancelled.' });
  }

  const show = db.findShowById(booking.showId);
  if (!show) {
    return res.status(400).json({ success: false, message: 'Associated show no longer exists.' });
  }

  // Business rule: Cancellations allowed up to 2 hours before showtime
  const showTimeMs = new Date(show.startTime).getTime();
  const nowMs = Date.now();
  if (showTimeMs - nowMs < 2 * 60 * 60 * 1000 && user.role !== 'admin') {
    return res.status(400).json({
      success: false,
      message: 'Cancellation is only permitted at least 2 hours prior to showtime.'
    });
  }

  // Update booking status
  db.updateBooking(booking.id, {
    bookingStatus: 'cancelled',
    paymentStatus: 'refunded',
    cancelledAt: new Date().toISOString(),
    cancellationReason: req.body.reason || 'User requested cancellation'
  });

  // Release seats back to show inventory
  const seatIds = booking.seats.map((s) => s.seatId);
  const showSeats = db.getShowSeats(booking.showId);
  showSeats.forEach((ss) => {
    if (seatIds.includes(ss.id)) {
      ss.status = 'available';
      ss.lockedBy = null;
      ss.lockedAt = null;
      ss.bookingId = null;
    }
  });
  db.save();

  // Create notification
  db.createNotification({
    id: `notif-${Date.now()}`,
    userId: booking.userId,
    title: 'Booking Cancelled',
    message: `Your booking ${booking.bookingReference} has been cancelled. Full refund of ₹${booking.totalAmount} will reflect in your account within 3-5 business days.`,
    type: 'cancellation',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Broadcast seat availability update
  seatBroadcaster.broadcast(booking.showId, {
    type: 'SEATS_RELEASED',
    payload: { showId: booking.showId, seatIds }
  });

  return res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully. Seats have been released.',
    data: { ...booking, bookingStatus: 'cancelled', paymentStatus: 'refunded' }
  });
});

// ==========================================
// 6. PAYMENT ENDPOINTS
// ==========================================

router.post('/payments/create-order', requireAuth, (req: AuthenticatedRequest, res) => {
  const { bookingId } = req.body;
  const user = req.user!;

  const booking = db.findBookingById(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  if (booking.userId !== user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized booking payment attempt.' });
  }

  if (booking.bookingStatus === 'confirmed') {
    return res.status(400).json({ success: false, message: 'This booking is already paid and confirmed.' });
  }

  const demoOrderId = 'DEMO_ORD_' + crypto.randomBytes(5).toString('hex').toUpperCase();

  const paymentRecord: PaymentRecord = {
    id: `pay-${Date.now()}`,
    bookingId: booking.id,
    userId: user.id,
    paymentProvider: 'demo',
    providerOrderId: demoOrderId,
    amount: booking.totalAmount,
    currency: 'INR',
    status: 'created',
    createdAt: new Date().toISOString()
  };

  db.createPayment(paymentRecord);

  return res.status(200).json({
    success: true,
    data: {
      provider: 'demo',
      orderId: demoOrderId,
      amount: booking.totalAmount,
      currency: 'INR',
      bookingId: booking.id,
      bookingReference: booking.bookingReference
    }
  });
});

router.post('/payments/verify', requireAuth, (req: AuthenticatedRequest, res) => {
  const { bookingId, orderId, paymentId } = req.body;
  const user = req.user!;

  const booking = db.findBookingById(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  if (booking.userId !== user.id) {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }

  // Confirm booking
  db.updateBooking(booking.id, {
    bookingStatus: 'confirmed',
    paymentStatus: 'paid'
  });

  // Lock seats permanently as booked
  const seatIds = booking.seats.map((s) => s.seatId);
  const showSeats = db.getShowSeats(booking.showId);
  showSeats.forEach((ss) => {
    if (seatIds.includes(ss.id)) {
      ss.status = 'booked';
      ss.bookingId = booking.id;
      ss.lockedBy = null;
      ss.lockedAt = null;
    }
  });
  db.save();

  // Create payment record update
  const payments = db.getPayments();
  const existingPay = payments.find((p) => p.bookingId === booking.id);
  if (existingPay) {
    existingPay.status = 'successful';
    existingPay.providerPaymentId = paymentId || `DEMO_PAY_${Date.now()}`;
    existingPay.providerSignature = 'DEMO_SIG_' + crypto.randomBytes(6).toString('hex');
    db.save();
  }

  // Create success notification
  const show = db.findShowById(booking.showId);
  const movie = show ? db.findMovieById(show.movieId) : null;
  const movieTitle = movie ? movie.title : 'Movie';

  db.createNotification({
    id: `notif-${Date.now()}`,
    userId: user.id,
    title: 'Booking Confirmed!',
    message: `Payment received for ${movieTitle}. Reference: ${booking.bookingReference}. Present digital QR at theatre entrance.`,
    type: 'booking',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  // Notify real-time listeners that seats are permanently booked
  seatBroadcaster.broadcast(booking.showId, {
    type: 'SEATS_BOOKED',
    payload: { showId: booking.showId, seatIds }
  });

  return res.status(200).json({
    success: true,
    message: 'Payment verified successfully! Your tickets are ready.',
    data: {
      ...booking,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid'
    }
  });
});

// ==========================================
// 7. REAL-TIME SEAT SSE STREAM
// ==========================================

router.get('/events/seats/:showId', (req, res: Response) => {
  const { showId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = seatBroadcaster.addClient(showId, res);

  req.on('close', () => {
    seatBroadcaster.removeClient(clientId);
  });
});

// ==========================================
// 8. ADMIN DASHBOARD & METRICS
// ==========================================

router.get('/admin/dashboard', requireAdmin, (req, res) => {
  const movies = db.getMovies();
  const theatres = db.getTheatres();
  const shows = db.getShows();
  const bookings = db.getBookings();
  const users = db.getUsers();

  const totalMovies = movies.length;
  const activeTheatres = theatres.filter((t) => t.isActive).length;
  const upcomingShows = shows.filter((s) => new Date(s.startTime).getTime() >= Date.now()).length;
  const confirmedBookings = bookings.filter((b) => b.bookingStatus === 'confirmed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  // Genre breakdown
  const genreCount: Record<string, number> = {};
  movies.forEach((m) => {
    m.genre.forEach((g) => {
      genreCount[g] = (genreCount[g] || 0) + 1;
    });
  });

  // Recent 10 bookings
  const recentBookings = bookings.slice(0, 10).map((b) => {
    const show = db.findShowById(b.showId);
    const movie = show ? db.findMovieById(show.movieId) : null;
    const theatre = show ? db.findTheatreById(show.theatreId) : null;
    const customer = db.findUserById(b.userId);

    return {
      ...b,
      movieTitle: movie?.title || 'Unknown Film',
      theatreName: theatre?.name || 'Unknown Cinema',
      customerName: customer?.name || 'Customer'
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      stats: {
        totalMovies,
        activeTheatres,
        upcomingShows,
        totalBookings: confirmedBookings.length,
        totalRevenue,
        totalUsers: users.length
      },
      genreBreakdown: genreCount,
      recentBookings
    }
  });
});

router.get('/admin/bookings', requireAdmin, (req, res) => {
  const { status, page = '1', limit = '15' } = req.query;
  let bookings = db.getBookings();

  if (status && typeof status === 'string' && status !== 'all') {
    bookings = bookings.filter((b) => b.bookingStatus === status);
  }

  const p = Math.max(1, parseInt(page as string, 10) || 1);
  const l = Math.max(1, parseInt(limit as string, 10) || 15);
  const total = bookings.length;
  const paginated = bookings.slice((p - 1) * l, p * l).map((b) => {
    const show = db.findShowById(b.showId);
    const movie = show ? db.findMovieById(show.movieId) : null;
    const theatre = show ? db.findTheatreById(show.theatreId) : null;
    const customer = db.findUserById(b.userId);

    return {
      ...b,
      movieTitle: movie?.title || 'Movie',
      theatreName: theatre?.name || 'Theatre',
      customerName: customer?.name || 'Customer',
      customerEmail: customer?.email || ''
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      bookings: paginated,
      pagination: {
        total,
        page: p,
        pages: Math.ceil(total / l),
        limit: l
      }
    }
  });
});

router.get('/admin/users', requireAdmin, (req, res) => {
  const users = db.getUsers().map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt
  }));
  return res.status(200).json({ success: true, data: users });
});

// ==========================================
// 9. NOTIFICATIONS ENDPOINTS
// ==========================================

router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const notifications = db.getNotifications(req.user!.id);
  return res.status(200).json({ success: true, data: notifications });
});

router.patch('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  const updated = db.markNotificationAsRead(req.params.id, req.user!.id);
  return res.status(200).json({ success: true, data: updated });
});

router.post('/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  db.markAllNotificationsAsRead(req.user!.id);
  return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
});

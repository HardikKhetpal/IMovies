import React, { useState, useEffect } from 'react';
import {
  Shield,
  Film,
  Calendar,
  Ticket,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  TrendingUp,
  BarChart3,
  X
} from 'lucide-react';
import { Movie, Show, Theatre, Booking } from '../types.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AdminDashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'shows' | 'bookings' | 'users'>('overview');
  const [loading, setLoading] = useState(true);

  // Dashboard Data
  const [stats, setStats] = useState<any>(null);
  const [genreBreakdown, setGenreBreakdown] = useState<Record<string, number>>({});
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  // Detailed lists
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [showsList, setShowsList] = useState<Show[]>([]);
  const [theatresList, setTheatresList] = useState<Theatre[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Modals & Forms
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [showAddShowModal, setShowAddShowModal] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New Movie Form State
  const [newMovie, setNewMovie] = useState({
    title: '',
    description: '',
    duration: 120,
    genre: 'Action, Sci-Fi',
    language: 'English',
    director: '',
    cast: '',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
    rating: 8.5,
    contentRating: 'UA',
    status: 'now_showing'
  });

  // New Show Form State
  const [newShow, setNewShow] = useState({
    movieId: '',
    theatreId: '',
    screenId: '',
    startTime: '',
    baseTicketPrice: 250
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/admin/dashboard');
      setStats(res.stats);
      setGenreBreakdown(res.genreBreakdown || {});
      setRecentBookings(res.recentBookings || []);

      // Also pre-fetch movies and theatres for quick CRUD actions
      const [mRes, tRes, sRes] = await Promise.all([
        api.get<{ movies: Movie[] }>('/movies?limit=50'),
        api.get<Theatre[]>('/theatres'),
        api.get<Show[]>('/shows')
      ]);

      setMoviesList(mRes.movies || []);
      setTheatresList(tRes || []);
      setShowsList(sRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsList = async () => {
    try {
      const res = await api.get<any>('/admin/bookings?limit=50');
      setAllBookings(res.bookings || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await api.get<any[]>('/admin/users');
      setUsersList(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboard();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookingsList();
    if (activeTab === 'users') fetchUsersList();
  }, [activeTab]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <Shield className="w-12 h-12 mx-auto text-amber-500" />
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-gray-400">
          This section is restricted to administrative staff. Please sign in with an administrator account.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="px-6 py-2.5 rounded-xl bg-[#e50914] text-white text-xs font-bold transition"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/movies', newMovie);
      setActionSuccess('Movie added to catalogue successfully!');
      setShowAddMovieModal(false);
      fetchDashboard();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error creating movie');
    }
  };

  const handleDeleteMovie = async (id: string) => {
    if (!window.confirm('Delete this movie? All scheduled shows will remain until cancelled.')) return;
    try {
      await api.delete(`/movies/${id}`);
      setActionSuccess('Movie removed successfully.');
      fetchDashboard();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error deleting movie');
    }
  };

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/shows', newShow);
      setActionSuccess('Show scheduled with full seat layout inventory!');
      setShowAddShowModal(false);
      fetchDashboard();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error creating show');
    }
  };

  const handleDeleteShow = async (id: string) => {
    if (!window.confirm('Cancel and delete this show?')) return;
    try {
      await api.delete(`/shows/${id}`);
      setActionSuccess('Show cancelled successfully.');
      fetchDashboard();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error deleting show');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Cinema Operations Command Center</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time management for films, auditoriums, showtimes, customer bookings, and revenue audit
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAddMovieModal(true)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4 text-[#e50914]" />
            <span>Add Movie</span>
          </button>
          <button
            onClick={() => {
              if (moviesList.length > 0 && theatresList.length > 0) {
                setNewShow({
                  movieId: moviesList[0].id,
                  theatreId: theatresList[0].id,
                  screenId: `scr-${theatresList[0].id}-1`,
                  startTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                  baseTicketPrice: 280
                });
              }
              setShowAddShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#e50914] hover:bg-[#b80710] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-red-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Show</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-[#12151c] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Total Revenue</span>
            <p className="text-2xl font-black text-[#e50914]">₹{stats.totalRevenue.toLocaleString()}</p>
            <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Verified Paid Orders</span>
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151c] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Tickets Booked</span>
            <p className="text-2xl font-black text-white">{stats.totalBookings}</p>
            <span className="text-[10px] text-gray-500">Confirmed seats</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151c] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Active Titles</span>
            <p className="text-2xl font-black text-white">{stats.totalMovies}</p>
            <span className="text-[10px] text-gray-500">In theatre database</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151c] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Upcoming Shows</span>
            <p className="text-2xl font-black text-white">{stats.upcomingShows}</p>
            <span className="text-[10px] text-gray-500">Live seat matrices</span>
          </div>

          <div className="p-5 rounded-2xl bg-[#12151c] border border-white/10 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Active Multiplexes</span>
            <p className="text-2xl font-black text-white">{stats.activeTheatres}</p>
            <span className="text-[10px] text-emerald-400">4 Major Hubs</span>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-white/10 overflow-x-auto pb-2 scrollbar-none text-xs">
        {(['overview', 'movies', 'shows', 'bookings', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-bold uppercase tracking-wider transition ${
              activeTab === tab
                ? 'bg-[#e50914] text-white shadow-md'
                : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            {tab === 'overview'
              ? 'Overview & Insights'
              : tab === 'movies'
              ? `Movies (${moviesList.length})`
              : tab === 'shows'
              ? `Scheduled Shows (${showsList.length})`
              : tab === 'bookings'
              ? 'Bookings Ledger'
              : 'Registered Users'}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Genre Distribution Highlights */}
          <div className="p-6 rounded-2xl bg-[#12151c] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#e50914]" />
                <span>Film Genre Portfolio Breakdown</span>
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Object.entries(genreBreakdown).map(([genreName, count]) => (
                <div key={genreName} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-gray-400 text-[10px] uppercase font-bold block">{genreName}</span>
                  <span className="text-lg font-black text-white">{count} titles</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Live Transactions */}
          <div className="p-6 rounded-2xl bg-[#12151c] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white">Recent Real-Time Ticket Transactions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-[11px] uppercase tracking-wider">
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Movie</th>
                    <th className="pb-3">Seats</th>
                    <th className="pb-3">Total Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-mono font-bold text-amber-400">{b.bookingReference}</td>
                      <td className="py-3 text-white font-medium">{b.customerName}</td>
                      <td className="py-3">{b.movieTitle}</td>
                      <td className="py-3 font-semibold text-white">
                        {b.seats.map((s: any) => `${s.rowLabel}${s.seatNumber}`).join(', ')}
                      </td>
                      <td className="py-3 font-bold text-white">₹{b.totalAmount}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            b.bookingStatus === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 text-[11px]">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOVIES MANAGEMENT */}
      {activeTab === 'movies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-bold text-white">Movie Titles Catalogue</h3>
            <button
              onClick={() => setShowAddMovieModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#e50914] text-white text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Film</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moviesList.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-[#12151c] border border-white/10 flex items-start space-x-4"
              >
                <img
                  src={m.posterUrl}
                  alt={m.title}
                  className="w-16 h-24 object-cover rounded-xl bg-white/5 flex-shrink-0"
                />
                <div className="flex-grow space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{m.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e50914] text-white">
                      {m.contentRating}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">{m.genre.join(', ')} • {m.duration} mins</p>
                  <p className="text-[11px] text-gray-500">Director: {m.director}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-amber-400 font-bold">★ {m.rating} Rating</span>
                    <button
                      onClick={() => handleDeleteMovie(m.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                      title="Delete Movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SHOWS SCHEDULING */}
      {activeTab === 'shows' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-sm font-bold text-white">Active & Upcoming Show Schedules</h3>
            <button
              onClick={() => setShowAddShowModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#e50914] text-white text-xs font-bold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Show</span>
            </button>
          </div>

          <div className="space-y-3">
            {showsList.map((s) => {
              const movie = moviesList.find((m) => m.id === s.movieId);
              const theatre = theatresList.find((t) => t.id === s.theatreId);
              const startTime = new Date(s.startTime);

              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-[#12151c] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{movie?.title || 'Movie'}</h4>
                    <p className="text-xs text-gray-400">{theatre?.name} • {s.screenId}</p>
                    <p className="text-xs text-emerald-400 font-medium mt-0.5">
                      {startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-left sm:text-right text-xs">
                      <span className="text-gray-400 block text-[10px]">Base Ticket Price</span>
                      <span className="text-white font-bold">₹{s.baseTicketPrice}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteShow(s.id)}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition"
                      title="Delete Show"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BOOKINGS LEDGER */}
      {activeTab === 'bookings' && (
        <div className="p-6 rounded-2xl bg-[#12151c] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white">Full Customer Bookings Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-3">Ref ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Movie</th>
                  <th className="pb-3">Auditorium</th>
                  <th className="pb-3">Allocated Seats</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {allBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono font-bold text-amber-400">{b.bookingReference}</td>
                    <td className="py-3">
                      <span className="text-white font-semibold block">{b.customerName}</span>
                      <span className="text-gray-500 text-[10px]">{b.customerEmail}</span>
                    </td>
                    <td className="py-3 text-white">{b.movieTitle}</td>
                    <td className="py-3 text-gray-400">{b.theatreName}</td>
                    <td className="py-3 font-semibold text-white">
                      {b.seats.map((s: any) => `${s.rowLabel}${s.seatNumber}`).join(', ')}
                    </td>
                    <td className="py-3 font-bold text-white">₹{b.totalAmount}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.bookingStatus === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REGISTERED USERS */}
      {activeTab === 'users' && (
        <div className="p-6 rounded-2xl bg-[#12151c] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white">Registered Customer Accounts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-mono text-gray-500">{u.id}</td>
                    <td className="py-3 text-white font-bold">{u.name}</td>
                    <td className="py-3 text-gray-300">{u.email}</td>
                    <td className="py-3 text-gray-400">{u.phone || '—'}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-white/10 text-gray-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD MOVIE MODAL */}
      {showAddMovieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#12151c] border border-white/20 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Add New Movie to Catalogue</h3>
              <button onClick={() => setShowAddMovieModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMovie} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Movie Title</label>
                  <input
                    type="text"
                    required
                    value={newMovie.title}
                    onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                    className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={newMovie.duration}
                    onChange={(e) => setNewMovie({ ...newMovie, duration: Number(e.target.value) })}
                    className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Synopsis / Description</label>
                <textarea
                  required
                  rows={3}
                  value={newMovie.description}
                  onChange={(e) => setNewMovie({ ...newMovie, description: e.target.value })}
                  className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Genres (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={newMovie.genre}
                    onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
                    className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Language</label>
                  <input
                    type="text"
                    required
                    value={newMovie.language}
                    onChange={(e) => setNewMovie({ ...newMovie, language: e.target.value })}
                    className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Director</label>
                  <input
                    type="text"
                    required
                    value={newMovie.director}
                    onChange={(e) => setNewMovie({ ...newMovie, director: e.target.value })}
                    className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Cast (comma separated)</label>
                <input
                  type="text"
                  value={newMovie.cast}
                  onChange={(e) => setNewMovie({ ...newMovie, cast: e.target.value })}
                  placeholder="Actor 1, Actor 2"
                  className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Poster Image URL</label>
                <input
                  type="url"
                  required
                  value={newMovie.posterUrl}
                  onChange={(e) => setNewMovie({ ...newMovie, posterUrl: e.target.value })}
                  className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Content Rating</label>
                  <select
                    value={newMovie.contentRating}
                    onChange={(e) => setNewMovie({ ...newMovie, contentRating: e.target.value as any })}
                    className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="UA">UA (Parental Guidance)</option>
                    <option value="A">A (Adult 18+)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-300 font-semibold">Status</label>
                  <select
                    value={newMovie.status}
                    onChange={(e) => setNewMovie({ ...newMovie, status: e.target.value as any })}
                    className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="now_showing">Now Showing</option>
                    <option value="coming_soon">Coming Soon</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddMovieModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#e50914] text-white font-bold"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE SHOW MODAL */}
      {showAddShowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#12151c] border border-white/20 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Schedule New Cinema Show</h3>
              <button onClick={() => setShowAddShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddShow} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Select Film</label>
                <select
                  required
                  value={newShow.movieId}
                  onChange={(e) => setNewShow({ ...newShow, movieId: e.target.value })}
                  className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                >
                  {moviesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.duration} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Select Theatre Multiplex</label>
                <select
                  required
                  value={newShow.theatreId}
                  onChange={(e) => setNewShow({ ...newShow, theatreId: e.target.value, screenId: `scr-${e.target.value}-1` })}
                  className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                >
                  {theatresList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Show Start Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newShow.startTime}
                  onChange={(e) => setNewShow({ ...newShow, startTime: e.target.value })}
                  className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-300 font-semibold">Base Ticket Price (₹)</label>
                <input
                  type="number"
                  required
                  value={newShow.baseTicketPrice}
                  onChange={(e) => setNewShow({ ...newShow, baseTicketPrice: Number(e.target.value) })}
                  className="w-full bg-[#181d26] border border-white/10 rounded-xl p-2.5 text-white"
                />
                <p className="text-[10px] text-gray-400">
                  Tiered prices will be auto-calculated: Standard ₹{newShow.baseTicketPrice}, Premium ₹{Math.round(newShow.baseTicketPrice * 1.35)}, Recliner ₹{Math.round(newShow.baseTicketPrice * 1.8)}.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#e50914] text-white font-bold"
                >
                  Create & Generate Seats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

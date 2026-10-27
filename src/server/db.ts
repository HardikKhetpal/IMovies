import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Movie,
  Theatre,
  Screen,
  PhysicalSeat,
  Show,
  ShowSeat,
  Booking,
  PaymentRecord,
  NotificationRecord
} from './types.ts';

interface DatabaseSchema {
  users: User[];
  movies: Movie[];
  theatres: Theatre[];
  screens: Screen[];
  physicalSeats: PhysicalSeat[];
  shows: Show[];
  showSeats: ShowSeat[];
  bookings: Booking[];
  payments: PaymentRecord[];
  notifications: NotificationRecord[];
}

const DB_FILE = path.resolve(process.cwd(), 'data', 'imovies_store.json');

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      movies: [],
      theatres: [],
      screens: [],
      physicalSeats: [],
      shows: [],
      showSeats: [],
      bookings: [],
      payments: [],
      notifications: []
    };
    this.init();
  }

  private init() {
    try {
      const dataDir = path.dirname(DB_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Clean expired holds on init
        this.cleanExpiredHolds();
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.warn('Initializing default in-memory seed database:', err);
      this.seedInitialData();
    }
  }

  public save() {
    try {
      const dataDir = path.dirname(DB_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  public cleanExpiredHolds() {
    const HOLD_DURATION_MS = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    let updated = false;

    this.data.showSeats.forEach((seat) => {
      if (seat.status === 'locked' && seat.lockedAt) {
        const lockedTime = new Date(seat.lockedAt).getTime();
        if (now - lockedTime > HOLD_DURATION_MS) {
          seat.status = 'available';
          seat.lockedBy = null;
          seat.lockedAt = null;
          updated = true;
        }
      }
    });

    if (updated) {
      this.save();
    }
  }

  private seedInitialData() {
    console.log('Seeding IMovies database with sample movies, theatres, screens, and shows...');

    // Users
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Admin@123', salt);
    const demoHash = bcrypt.hashSync('User@123', salt);

    const adminUser: User = {
      id: 'usr-admin-1',
      name: 'Cinema Administrator',
      email: 'admin@imovies.com',
      passwordHash: adminHash,
      phone: '+1 (555) 019-2834',
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    const demoUser: User = {
      id: 'usr-customer-1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      passwordHash: demoHash,
      phone: '+1 (555) 014-9988',
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    this.data.users = [adminUser, demoUser];

    // Movies (10 diverse titles with high-res cinematic images)
    const movies: Movie[] = [
      {
        id: 'mov-1',
        title: 'Dune: Part Two',
        slug: 'dune-part-two',
        description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
        genre: ['Sci-Fi', 'Adventure', 'Action'],
        language: 'English',
        duration: 166,
        releaseDate: '2024-03-01',
        cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler', 'Florence Pugh'],
        director: 'Denis Villeneuve',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        rating: 8.8,
        contentRating: 'UA',
        status: 'now_showing',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mov-2',
        title: 'Oppenheimer',
        slug: 'oppenheimer',
        description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project, exploring the moral and geopolitical aftermath.',
        genre: ['Biography', 'Drama', 'History'],
        language: 'English',
        duration: 180,
        releaseDate: '2023-07-21',
        cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.', 'Florence Pugh'],
        director: 'Christopher Nolan',
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        rating: 8.9,
        contentRating: 'A',
        status: 'now_showing',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mov-3',
        title: 'Interstellar: 10th Anniversary IMAX',
        slug: 'interstellar',
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers through a newly discovered wormhole in search of a new home for mankind.',
        genre: ['Sci-Fi', 'Drama', 'Adventure'],
        language: 'English',
        duration: 169,
        releaseDate: '2014-11-07',
        cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
        director: 'Christopher Nolan',
        posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        rating: 8.7,
        contentRating: 'UA',
        status: 'now_showing',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mov-4',
        title: 'The Dark Knight',
        slug: 'the-dark-knight',
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        genre: ['Action', 'Crime', 'Drama'],
        language: 'English',
        duration: 152,
        releaseDate: '2008-07-18',
        cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine', 'Morgan Freeman'],
        director: 'Christopher Nolan',
        posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=EXeTwQWrcwY',
        rating: 9.0,
        contentRating: 'UA',
        status: 'now_showing',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mov-5',
        title: 'Gladiator II',
        slug: 'gladiator-ii',
        description: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist.',
        genre: ['Action', 'Adventure', 'Drama'],
        language: 'English',
        duration: 148,
        releaseDate: '2024-11-22',
        cast: ['Paul Mescal', 'Pedro Pascal', 'Denzel Washington', 'Connie Nielsen'],
        director: 'Ridley Scott',
        posterUrl: 'https://images.unsplash.com/photo-1533928298208-27ff66555d8d?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1600&auto=format&fit=crop',
        rating: 8.4,
        contentRating: 'A',
        status: 'now_showing',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mov-6',
        title: 'Avatar: Fire and Ash',
        slug: 'avatar-fire-and-ash',
        description: 'Jake Sully and Neytiri encounter a new, aggressive tribe of Na\'vi known as the "Ash People" who live near volcanoes on Pandora, forcing them to navigate unprecedented threats.',
        genre: ['Sci-Fi', 'Action', 'Fantasy'],
        language: 'English',
        duration: 190,
        releaseDate: '2025-12-19',
        cast: ['Sam Worthington', 'Zoe Saldaña', 'Sigourney Weaver', 'Stephen Lang'],
        director: 'James Cameron',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop',
        rating: 8.6,
        contentRating: 'UA',
        status: 'coming_soon',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mov-7',
        title: 'Cyberpunk: Neon Horizon',
        slug: 'cyberpunk-neon-horizon',
        description: 'In a dystopian mega-city bathed in neon light and persistent rain, a rogue memory hacker stumbles upon a conspiracy that threatens to rewrite human consciousness.',
        genre: ['Action', 'Sci-Fi', 'Thriller'],
        language: 'English',
        duration: 135,
        releaseDate: '2025-01-15',
        cast: ['Keanu Vance', 'Elena Rostova', 'Marcus Thorne'],
        director: 'Kavita Sen',
        posterUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=1600&auto=format&fit=crop',
        rating: 8.2,
        contentRating: 'A',
        status: 'now_showing',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mov-8',
        title: 'Echoes of the Serengeti',
        slug: 'echoes-of-the-serengeti',
        description: 'A breathtaking wildlife documentary capturing the grand migration, intimate survival narratives, and the majestic balance of nature across East Africa in 8K panoramic cinematography.',
        genre: ['Documentary', 'Adventure'],
        language: 'English',
        duration: 98,
        releaseDate: '2024-09-10',
        cast: ['David Attenborough (Narrator)'],
        director: 'Alistair Fothergill',
        posterUrl: 'https://images.unsplash.com/photo-1534177616072-ef7dc120449d?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=1600&auto=format&fit=crop',
        rating: 9.1,
        contentRating: 'U',
        status: 'now_showing',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mov-9',
        title: 'Midnight in Kyoto',
        slug: 'midnight-in-kyoto',
        description: 'Two estranged souls meet during an unexpected thunderstorm inside a traditional tea house in Kyoto, embarking on a poetic journey through historic alleys and emotional healing.',
        genre: ['Romance', 'Drama'],
        language: 'Japanese',
        duration: 114,
        releaseDate: '2024-10-05',
        cast: ['Ken Watanabe', 'Tao Tsuchiya', 'Ryo Kase'],
        director: 'Hirokazu Kore-eda',
        posterUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1600&auto=format&fit=crop',
        rating: 8.5,
        contentRating: 'UA',
        status: 'now_showing',
        createdAt: new Date().toISOString()
      },
      {
        id: 'mov-10',
        title: 'Quantum Paradox',
        slug: 'quantum-paradox',
        description: 'When a particle physics laboratory experiences an uncontained quantum fluctuation, five scientists wake up in a parallel timeline where humanity never developed digital technology.',
        genre: ['Sci-Fi', 'Mystery', 'Thriller'],
        language: 'English',
        duration: 128,
        releaseDate: '2025-04-12',
        cast: ['David Tennant', 'Gemma Chan', 'Dev Patel'],
        director: 'Alex Garland',
        posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1600&auto=format&fit=crop',
        rating: 8.3,
        contentRating: 'UA',
        status: 'coming_soon',
        createdAt: new Date().toISOString()
      }
    ];

    this.data.movies = movies;

    // Theatres across 4 major regions
    const theatres: Theatre[] = [
      {
        id: 'th-1',
        name: 'IMovies Grand IMAX & Lounge',
        address: 'Palladium Mall, Senapati Bapat Marg, Lower Parel',
        city: 'Mumbai',
        state: 'Maharashtra',
        facilities: ['IMAX Laser 4K', 'Dolby Atmos 7.1', 'Luxury Recliners', 'Gourmet Bistro', 'Valet Parking'],
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'th-2',
        name: 'IMovies Cineplex Apex',
        address: 'DLF Cyber City, Sector 24, Cyber Hub',
        city: 'Delhi NCR',
        state: 'Delhi',
        facilities: ['4DX Motion Cinema', 'Dolby Atmos', 'Wheelchair Access', 'Prime Cafe'],
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'th-3',
        name: 'IMovies Starlight Multiplex',
        address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        facilities: ['Dolby Atmos', 'Barco 4K RGB Laser', 'In-Seat Food Delivery', 'Arcade'],
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'th-4',
        name: 'IMovies Manhattan Prime Theatre',
        address: '42nd Street & 8th Avenue, Times Square',
        city: 'New York',
        state: 'NY',
        facilities: ['IMAX 70mm', 'Dolby Cinema', 'VIP Lounge', 'Cocktail Bar'],
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    this.data.theatres = theatres;

    // Screens and physical seats
    const screens: Screen[] = [];
    const physicalSeats: PhysicalSeat[] = [];

    theatres.forEach((th, thIdx) => {
      // 2 screens per theatre
      for (let sIdx = 1; sIdx <= 2; sIdx++) {
        const screenId = `scr-${th.id}-${sIdx}`;
        const screenName = sIdx === 1 ? 'Audi 1 - IMAX Experience' : 'Audi 2 - Dolby Atmos Prime';

        const rowConfigs: { row: string; seatCount: number; seatType: 'standard' | 'premium' | 'recliner' }[] = [
          { row: 'A', seatCount: 10, seatType: 'standard' },
          { row: 'B', seatCount: 10, seatType: 'standard' },
          { row: 'C', seatCount: 10, seatType: 'premium' },
          { row: 'D', seatCount: 10, seatType: 'premium' },
          { row: 'E', seatCount: 8, seatType: 'recliner' },
          { row: 'F', seatCount: 8, seatType: 'recliner' }
        ];

        let total = 0;
        rowConfigs.forEach((rc) => {
          total += rc.seatCount;
          for (let seatNum = 1; seatNum <= rc.seatCount; seatNum++) {
            physicalSeats.push({
              id: `seat-${screenId}-${rc.row}${seatNum}`,
              screenId,
              rowLabel: rc.row,
              seatNumber: seatNum,
              seatType: rc.seatType
            });
          }
        });

        screens.push({
          id: screenId,
          theatreId: th.id,
          screenName,
          totalSeats: total,
          isActive: true,
          seatRows: rowConfigs
        });
      }
    });

    this.data.screens = screens;
    this.data.physicalSeats = physicalSeats;

    // Generate Shows for the active movies over the next 3 days
    const shows: Show[] = [];
    const showSeats: ShowSeat[] = [];

    const activeMovies = movies.filter((m) => m.status === 'now_showing');
    const now = new Date();

    let showCounter = 1;

    theatres.forEach((theatre) => {
      const theatreScreens = screens.filter((s) => s.theatreId === theatre.id);

      theatreScreens.forEach((screen) => {
        // Schedule 3 shows per day for today, tomorrow, and day after
        for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
          const showSlots = [
            { hour: 11, minute: 30, basePrice: 220 },
            { hour: 15, minute: 45, basePrice: 280 },
            { hour: 19, minute: 30, basePrice: 350 },
            { hour: 22, minute: 45, basePrice: 320 }
          ];

          showSlots.forEach((slot, slotIdx) => {
            const movie = activeMovies[(showCounter + slotIdx) % activeMovies.length];
            const startTime = new Date(now);
            startTime.setDate(now.getDate() + dayOffset);
            startTime.setHours(slot.hour, slot.minute, 0, 0);

            const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000);

            const showId = `shw-${theatre.id}-${screen.id}-${dayOffset}-${slotIdx}`;
            const showObj: Show = {
              id: showId,
              movieId: movie.id,
              theatreId: theatre.id,
              screenId: screen.id,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              baseTicketPrice: slot.basePrice,
              pricing: {
                standard: slot.basePrice,
                premium: Math.round(slot.basePrice * 1.35),
                recliner: Math.round(slot.basePrice * 1.8)
              },
              status: 'scheduled',
              createdAt: new Date().toISOString()
            };

            shows.push(showObj);

            // Populate show seat inventory
            const screenSeatList = physicalSeats.filter((ps) => ps.screenId === screen.id);
            screenSeatList.forEach((ps) => {
              // Pre-book 2-3 seats for realism in past or first shows
              const isPrebooked = dayOffset === 0 && slotIdx === 0 && (ps.rowLabel === 'C' && (ps.seatNumber === 4 || ps.seatNumber === 5));

              showSeats.push({
                id: `ss-${showId}-${ps.id}`,
                showId,
                seatId: ps.id,
                rowLabel: ps.rowLabel,
                seatNumber: ps.seatNumber,
                seatType: ps.seatType,
                price: showObj.pricing[ps.seatType] || showObj.baseTicketPrice,
                status: isPrebooked ? 'booked' : 'available',
                lockedBy: null,
                lockedAt: null,
                bookingId: isPrebooked ? 'bk-preseed-1' : null
              });
            });

            showCounter++;
          });
        }
      });
    });

    this.data.shows = shows;
    this.data.showSeats = showSeats;

    // Seed sample completed booking
    const sampleShow = shows[0];
    if (sampleShow) {
      const sampleBooking: Booking = {
        id: 'bk-preseed-1',
        bookingReference: 'BK-IMOV-8932',
        userId: demoUser.id,
        showId: sampleShow.id,
        seats: [
          { seatId: 'seat-1', rowLabel: 'C', seatNumber: 4, seatType: 'premium', price: 380 },
          { seatId: 'seat-2', rowLabel: 'C', seatNumber: 5, seatType: 'premium', price: 380 }
        ],
        amountBreakdown: {
          subtotal: 760,
          convenienceFee: 76,
          tax: 14
        },
        totalAmount: 850,
        bookingStatus: 'confirmed',
        paymentStatus: 'paid',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      };

      this.data.bookings = [sampleBooking];

      this.data.payments = [
        {
          id: 'pay-preseed-1',
          bookingId: sampleBooking.id,
          userId: demoUser.id,
          paymentProvider: 'demo',
          providerOrderId: 'DEMO_ORD_8932',
          providerPaymentId: 'DEMO_PAY_77123',
          amount: 850,
          currency: 'INR',
          status: 'successful',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      this.data.notifications = [
        {
          id: 'notif-1',
          userId: demoUser.id,
          title: 'Welcome to IMovies!',
          message: 'Enjoy real-time seat reservation with instant confirmation and paperless tickets.',
          type: 'system',
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 'notif-2',
          userId: demoUser.id,
          title: 'Booking Confirmed - Dune: Part Two',
          message: 'Your booking BK-IMOV-8932 has been confirmed for Seats C4, C5. Enjoy your show!',
          type: 'booking',
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }

    console.log(`Successfully seeded ${movies.length} movies, ${theatres.length} theatres, ${shows.length} shows, and ${showSeats.length} show seats!`);
  }

  // Getters & Query Methods
  public getUsers() {
    return this.data.users;
  }

  public findUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User) {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  public getMovies() {
    return this.data.movies;
  }

  public findMovieById(id: string) {
    return this.data.movies.find((m) => m.id === id || m.slug === id);
  }

  public createMovie(movie: Movie) {
    this.data.movies.unshift(movie);
    this.save();
    return movie;
  }

  public updateMovie(id: string, updates: Partial<Movie>) {
    const idx = this.data.movies.findIndex((m) => m.id === id);
    if (idx !== -1) {
      this.data.movies[idx] = { ...this.data.movies[idx], ...updates };
      this.save();
      return this.data.movies[idx];
    }
    return null;
  }

  public deleteMovie(id: string) {
    const idx = this.data.movies.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const deleted = this.data.movies.splice(idx, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }

  public getTheatres() {
    return this.data.theatres;
  }

  public findTheatreById(id: string) {
    return this.data.theatres.find((t) => t.id === id);
  }

  public createTheatre(theatre: Theatre) {
    this.data.theatres.push(theatre);
    this.save();
    return theatre;
  }

  public updateTheatre(id: string, updates: Partial<Theatre>) {
    const idx = this.data.theatres.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.data.theatres[idx] = { ...this.data.theatres[idx], ...updates };
      this.save();
      return this.data.theatres[idx];
    }
    return null;
  }

  public deleteTheatre(id: string) {
    const idx = this.data.theatres.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const deleted = this.data.theatres.splice(idx, 1)[0];
      this.save();
      return deleted;
    }
    return null;
  }

  public getScreens(theatreId?: string) {
    if (theatreId) {
      return this.data.screens.filter((s) => s.theatreId === theatreId);
    }
    return this.data.screens;
  }

  public findScreenById(id: string) {
    return this.data.screens.find((s) => s.id === id);
  }

  public createScreen(screen: Screen) {
    this.data.screens.push(screen);
    // Also generate physical seats
    screen.seatRows.forEach((rc) => {
      for (let sNum = 1; sNum <= rc.seatCount; sNum++) {
        this.data.physicalSeats.push({
          id: `seat-${screen.id}-${rc.row}${sNum}`,
          screenId: screen.id,
          rowLabel: rc.row,
          seatNumber: sNum,
          seatType: rc.seatType
        });
      }
    });
    this.save();
    return screen;
  }

  public getShows(filter?: { movieId?: string; theatreId?: string; city?: string; date?: string }) {
    let result = this.data.shows;

    if (filter?.movieId) {
      result = result.filter((s) => s.movieId === filter.movieId);
    }
    if (filter?.theatreId) {
      result = result.filter((s) => s.theatreId === filter.theatreId);
    }
    if (filter?.city) {
      const cityTheatreIds = this.data.theatres
        .filter((t) => t.city.toLowerCase() === filter.city!.toLowerCase())
        .map((t) => t.id);
      result = result.filter((s) => cityTheatreIds.includes(s.theatreId));
    }
    if (filter?.date) {
      const targetDate = new Date(filter.date).toISOString().slice(0, 10);
      result = result.filter((s) => s.startTime.startsWith(targetDate));
    }

    return result;
  }

  public findShowById(id: string) {
    return this.data.shows.find((s) => s.id === id);
  }

  public createShow(show: Show) {
    this.data.shows.push(show);

    // Instantiate physical seats into showSeat inventory
    const screenSeats = this.data.physicalSeats.filter((ps) => ps.screenId === show.screenId);
    screenSeats.forEach((ps) => {
      this.data.showSeats.push({
        id: `ss-${show.id}-${ps.id}`,
        showId: show.id,
        seatId: ps.id,
        rowLabel: ps.rowLabel,
        seatNumber: ps.seatNumber,
        seatType: ps.seatType,
        price: show.pricing[ps.seatType] || show.baseTicketPrice,
        status: 'available',
        lockedBy: null,
        lockedAt: null,
        bookingId: null
      });
    });

    this.save();
    return show;
  }

  public deleteShow(id: string) {
    const idx = this.data.shows.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const deleted = this.data.shows.splice(idx, 1)[0];
      this.data.showSeats = this.data.showSeats.filter((ss) => ss.showId !== id);
      this.save();
      return deleted;
    }
    return null;
  }

  public getShowSeats(showId: string): ShowSeat[] {
    this.cleanExpiredHolds();
    return this.data.showSeats.filter((ss) => ss.showId === showId);
  }

  /**
   * Atomic hold with 5-minute TTL check and conflict avoidance
   */
  public holdSeats(showId: string, seatIds: string[], userId: string): { success: boolean; heldSeats?: ShowSeat[]; error?: string } {
    this.cleanExpiredHolds();
    const HOLD_DURATION_MS = 5 * 60 * 1000;
    const now = Date.now();

    const candidateSeats = this.data.showSeats.filter((ss) => ss.showId === showId && seatIds.includes(ss.id));

    if (candidateSeats.length !== seatIds.length) {
      return { success: false, error: 'One or more selected seats were not found for this show.' };
    }

    // Verify all candidate seats are available or already held by the same user
    for (const seat of candidateSeats) {
      if (seat.status === 'booked') {
        return { success: false, error: `Seat ${seat.rowLabel}${seat.seatNumber} is already booked.` };
      }
      if (seat.status === 'locked' && seat.lockedBy !== userId) {
        const lockedTime = seat.lockedAt ? new Date(seat.lockedAt).getTime() : 0;
        if (now - lockedTime <= HOLD_DURATION_MS) {
          return { success: false, error: `Seat ${seat.rowLabel}${seat.seatNumber} is currently held by another user.` };
        }
      }
    }

    // Lock all seats atomically
    candidateSeats.forEach((seat) => {
      seat.status = 'locked';
      seat.lockedBy = userId;
      seat.lockedAt = new Date().toISOString();
    });

    this.save();
    return { success: true, heldSeats: candidateSeats };
  }

  public releaseHeldSeats(showId: string, seatIds: string[], userId: string) {
    let changed = false;
    this.data.showSeats.forEach((seat) => {
      if (seat.showId === showId && seatIds.includes(seat.id) && seat.lockedBy === userId && seat.status === 'locked') {
        seat.status = 'available';
        seat.lockedBy = null;
        seat.lockedAt = null;
        changed = true;
      }
    });
    if (changed) {
      this.save();
    }
  }

  public createBooking(booking: Booking) {
    this.data.bookings.unshift(booking);
    this.save();
    return booking;
  }

  public getBookings(userId?: string) {
    if (userId) {
      return this.data.bookings.filter((b) => b.userId === userId);
    }
    return this.data.bookings;
  }

  public findBookingById(id: string) {
    return this.data.bookings.find((b) => b.id === id || b.bookingReference === id);
  }

  public updateBooking(id: string, updates: Partial<Booking>) {
    const idx = this.data.bookings.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.data.bookings[idx] = { ...this.data.bookings[idx], ...updates };
      this.save();
      return this.data.bookings[idx];
    }
    return null;
  }

  public createPayment(payment: PaymentRecord) {
    this.data.payments.unshift(payment);
    this.save();
    return payment;
  }

  public getPayments() {
    return this.data.payments;
  }

  public createNotification(notif: NotificationRecord) {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }

  public getNotifications(userId: string) {
    return this.data.notifications.filter((n) => n.userId === userId);
  }

  public markNotificationAsRead(id: string, userId: string) {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (notif) {
      notif.isRead = true;
      this.save();
      return notif;
    }
    return null;
  }

  public markAllNotificationsAsRead(userId: string) {
    this.data.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    this.save();
  }
}

export const db = new DatabaseStore();

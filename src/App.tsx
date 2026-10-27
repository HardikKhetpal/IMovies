import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { BookingProvider } from './context/BookingContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

// Pages
import { HomePage } from './pages/HomePage.tsx';
import { MoviesPage } from './pages/MoviesPage.tsx';
import { MovieDetailsPage } from './pages/MovieDetailsPage.tsx';
import { SeatSelectionPage } from './pages/SeatSelectionPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage.tsx';
import { MyBookingsPage } from './pages/MyBookingsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';

interface NavigationState {
  page: string;
  params?: any;
}

export default function App() {
  const [navState, setNavState] = useState<NavigationState>({
    page: 'home',
    params: {}
  });

  const handleNavigate = (page: string, params: any = {}) => {
    setNavState({ page, params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (navState.page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'movies':
        return <MoviesPage onNavigate={handleNavigate} initialParams={navState.params} />;
      case 'movie-details':
        return (
          <MovieDetailsPage
            movieId={navState.params?.id || 'mov-1'}
            onNavigate={handleNavigate}
          />
        );
      case 'seat-selection':
        return (
          <SeatSelectionPage
            showId={navState.params?.showId}
            onNavigate={handleNavigate}
          />
        );
      case 'checkout':
        return <CheckoutPage onNavigate={handleNavigate} />;
      case 'confirmation':
        return (
          <BookingConfirmationPage
            bookingId={navState.params?.bookingId}
            onNavigate={handleNavigate}
          />
        );
      case 'my-bookings':
        return <MyBookingsPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} redirectParams={navState.params} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminDashboardPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <BookingProvider>
        <div className="min-h-screen flex flex-col bg-[#0a0c0f] text-gray-100 selection:bg-[#e50914] selection:text-white">
          <Navbar onNavigate={handleNavigate} currentPage={navState.page} />
          <main className="flex-grow">
            {renderCurrentPage()}
          </main>
          <Footer />
        </div>
      </BookingProvider>
    </AuthProvider>
  );
}

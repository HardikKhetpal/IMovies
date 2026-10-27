import React, { useState } from 'react';
import { Film, MapPin, Search, Bell, User as UserIcon, LogOut, Ticket, Shield, Check, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  onNavigate: (page: string, params?: any) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { user, isAuthenticated, isAdmin, logout, selectedCity, setSelectedCity, notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cities = ['All', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'New York'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('movies', { search: searchQuery.trim() });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0c0f]/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & City Selector */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 text-white font-extrabold text-2xl tracking-tight group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#b80710] to-[#e50914] flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                I<span className="text-[#e50914]">MOVIES</span>
              </span>
            </button>

            {/* City Selector */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm">
              <MapPin className="w-4 h-4 text-[#e50914]" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-gray-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                {cities.map((c) => (
                  <option key={c} value={c} className="bg-[#12151c] text-white">
                    {c === 'All' ? 'All Locations' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search movies, genres, directors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181d26] border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all"
              />
            </div>
          </form>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <button
              onClick={() => onNavigate('home')}
              className={`transition-colors ${currentPage === 'home' ? 'text-[#e50914] font-semibold' : 'text-gray-300 hover:text-white'}`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('movies')}
              className={`transition-colors ${currentPage === 'movies' ? 'text-[#e50914] font-semibold' : 'text-gray-300 hover:text-white'}`}
            >
              Movies
            </button>
            {isAuthenticated && (
              <button
                onClick={() => onNavigate('my-bookings')}
                className={`transition-colors ${currentPage === 'my-bookings' ? 'text-[#e50914] font-semibold' : 'text-gray-300 hover:text-white'}`}
              >
                My Bookings
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </button>
            )}
          </nav>

          {/* Right Actions: Notifications & Auth */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/5 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#e50914] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#12151c] border border-white/10 shadow-2xl z-50 p-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white">Notifications</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#e50914]/20 text-[#e50914] font-semibold">
                          {unreadCount} new
                        </span>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-xs text-gray-400 hover:text-[#e50914] transition"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            className={`p-3 rounded-xl cursor-pointer transition ${
                              n.isRead ? 'bg-white/[0.02] hover:bg-white/5' : 'bg-[#e50914]/10 border border-[#e50914]/20'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <h5 className="text-xs font-semibold text-white">{n.title}</h5>
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#e50914] mt-1"></span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-gray-500 mt-2 block">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons or User Profile */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 pl-3 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition"
                >
                  <span className="text-xs font-medium text-gray-200 hidden sm:inline">{user.name.split(' ')[0]}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#12151c] border border-white/10 shadow-2xl z-50 p-2">
                    <div className="px-3 py-2 border-b border-white/10">
                      <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('profile');
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                      >
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span>My Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('my-bookings');
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                      >
                        <Ticket className="w-4 h-4 text-gray-400" />
                        <span>My Bookings</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigate('admin');
                          }}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 rounded-xl transition"
                        >
                          <Shield className="w-4 h-4 text-amber-400" />
                          <span>Admin Control</span>
                        </button>
                      )}

                      <div className="my-1 border-t border-white/10"></div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          onNavigate('home');
                        }}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onNavigate('login')}
                  className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-2 rounded-lg transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="text-xs font-semibold text-white bg-[#e50914] hover:bg-[#b80710] px-4 py-2 rounded-full shadow-lg shadow-red-600/20 hover:scale-105 transition-all"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-300 hover:text-white focus:outline-none"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-3">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs">
              <MapPin className="w-4 h-4 text-[#e50914]" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-gray-200 text-xs font-medium focus:outline-none w-full"
              >
                {cities.map((c) => (
                  <option key={c} value={c} className="bg-[#12151c] text-white">
                    {c === 'All' ? 'All Locations' : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onNavigate('home');
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-lg"
              >
                Home
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onNavigate('movies');
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-lg"
              >
                Movies
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('my-bookings');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-lg"
                >
                  My Bookings
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onNavigate('admin');
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg"
                >
                  Admin Dashboard
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { Play, Ticket, Star, Clock, Info, X } from 'lucide-react';
import { Movie } from '../types.ts';

interface HeroBannerProps {
  movies: Movie[];
  onBookMovie: (movieId: string) => void;
  onMovieDetails: (movieId: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movies, onBookMovie, onMovieDetails }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  const currentMovie = movies[currentIndex] || movies[0];

  if (!currentMovie) return null;

  return (
    <div className="relative w-full h-[600px] sm:h-[650px] overflow-hidden bg-[#0a0c0f]">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        <img
          src={currentMovie.backdropUrl || currentMovie.posterUrl}
          alt={currentMovie.title}
          className="w-full h-full object-cover object-top opacity-40 scale-105 transition-all duration-700 filter brightness-90"
        />
        {/* Layered gradients for cinematic depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0f] via-[#0a0c0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c0f] via-[#0a0c0f]/70 to-transparent w-full md:w-3/4" />
      </div>

      {/* Main Content Info */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Tags */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-[#e50914] text-white font-extrabold uppercase tracking-wider text-[11px] shadow-lg shadow-red-600/30">
              FEATURED BLOCKBUSTER
            </span>
            <span className="px-2.5 py-1 rounded-md bg-black/60 border border-white/10 text-white font-semibold text-[11px]">
              {currentMovie.contentRating}
            </span>
            <div className="flex items-center space-x-1 text-amber-400 font-bold">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{currentMovie.rating.toFixed(1)} Rating</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            {currentMovie.title}
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 font-medium">
            <span>{currentMovie.genre.join(' • ')}</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{Math.floor(currentMovie.duration / 60)}h {currentMovie.duration % 60}m</span>
            </div>
            <span>•</span>
            <span>Director: {currentMovie.director}</span>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-3 max-w-xl">
            {currentMovie.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onBookMovie(currentMovie.id)}
              className="px-6 py-3.5 rounded-xl bg-[#e50914] hover:bg-[#b80710] text-white font-bold text-sm flex items-center space-x-2 shadow-xl shadow-red-600/30 hover:scale-105 transition-all"
            >
              <Ticket className="w-5 h-5" />
              <span>Book Tickets</span>
            </button>

            {currentMovie.trailerUrl && (
              <button
                onClick={() => setShowTrailerModal(true)}
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-sm flex items-center space-x-2 border border-white/20 transition-all hover:scale-105"
              >
                <Play className="w-5 h-5 text-[#e50914] fill-[#e50914]" />
                <span>Watch Trailer</span>
              </button>
            )}

            <button
              onClick={() => onMovieDetails(currentMovie.id)}
              className="px-4 py-3.5 rounded-xl bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-semibold text-sm flex items-center space-x-1.5 transition"
            >
              <Info className="w-4 h-4" />
              <span>More Info</span>
            </button>
          </div>
        </div>

        {/* Carousel indicators / thumbnail selector */}
        <div className="hidden md:flex items-center space-x-3 pt-8">
          {movies.slice(0, 5).map((m, idx) => (
            <button
              key={m.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                idx === currentIndex
                  ? 'bg-white/20 border-white text-white shadow-lg'
                  : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: idx === currentIndex ? '#e50914' : '#6b7280' }} />
              <span className="truncate max-w-[120px]">{m.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trailer Video Modal */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#12151c] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#181d26]">
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4 text-[#e50914] fill-[#e50914]" />
                <h4 className="text-white text-sm font-bold truncate">{currentMovie.title} - Official Trailer</h4>
              </div>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {currentMovie.trailerUrl?.includes('youtube.com') || currentMovie.trailerUrl?.includes('youtu.be') ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${currentMovie.trailerUrl.split('v=')[1] || 'Way9Dexny3w'}?autoplay=1`}
                  title={currentMovie.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <Play className="w-12 h-12 text-[#e50914]" />
                  <p className="text-sm">Official HD Trailer Stream</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Star, Clock, Calendar, Ticket } from 'lucide-react';
import { Movie } from '../types.ts';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movieId: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onSelect }) => {
  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div
      onClick={() => onSelect(movie.id)}
      className="group relative bg-[#12151c] rounded-2xl border border-white/10 overflow-hidden cursor-pointer hover:border-[#e50914]/50 hover:shadow-2xl hover:shadow-red-950/40 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1.5"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#181d26]">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop';
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12151c] via-transparent to-black/30" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#e50914] text-white shadow-md">
            {movie.contentRating}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/60 backdrop-blur-md text-gray-200 border border-white/10">
            {movie.language}
          </span>
        </div>

        {/* Rating */}
        <div className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-amber-400 font-bold text-xs border border-amber-400/20">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          <span>{movie.rating.toFixed(1)}</span>
        </div>

        {/* Status pill if coming soon */}
        {movie.status === 'coming_soon' && (
          <div className="absolute bottom-3 left-3 right-3">
            <span className="block text-center text-xs font-bold py-1 px-2 rounded-lg bg-amber-500/90 text-black shadow-lg">
              Coming Soon
            </span>
          </div>
        )}
      </div>

      {/* Movie Details */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-white font-bold text-base leading-snug line-clamp-1 group-hover:text-[#e50914] transition-colors">
          {movie.title}
        </h3>

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {movie.genre.slice(0, 3).map((g) => (
            <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
              {g}
            </span>
          ))}
        </div>

        {/* Metadata: Duration & Release */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span>{formatDuration(movie.duration)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <span>{new Date(movie.releaseDate).getFullYear()}</span>
          </div>
        </div>

        {/* Book Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(movie.id);
          }}
          className="mt-4 w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 bg-white/5 hover:bg-[#e50914] text-white border border-white/10 hover:border-[#e50914] group-hover:bg-[#e50914] transition-all shadow-md"
        >
          <Ticket className="w-4 h-4" />
          <span>{movie.status === 'coming_soon' ? 'View Details' : 'Book Tickets'}</span>
        </button>
      </div>
    </div>
  );
};

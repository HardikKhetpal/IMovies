import React from 'react';
import { Film, ShieldCheck, CreditCard, Sparkles, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07090c] border-t border-white/10 text-gray-400 text-sm mt-auto">
      {/* Experience Highlights */}
      <div className="border-b border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-3">
              <div className="p-3 rounded-xl bg-red-600/10 text-[#e50914]">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h6 className="text-white text-xs font-bold uppercase tracking-wider">IMAX Laser 4K</h6>
                <p className="text-[11px] text-gray-500 mt-0.5">Ultra-crisp high dynamic range & immersive sound</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-3">
              <div className="p-3 rounded-xl bg-blue-600/10 text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h6 className="text-white text-xs font-bold uppercase tracking-wider">Real-Time Seats</h6>
                <p className="text-[11px] text-gray-500 mt-0.5">Zero double bookings with 5-minute atomic holds</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-3">
              <div className="p-3 rounded-xl bg-green-600/10 text-green-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h6 className="text-white text-xs font-bold uppercase tracking-wider">Secure Checkout</h6>
                <p className="text-[11px] text-gray-500 mt-0.5">Instant refunds & contactless digital ticketing</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-3">
              <div className="p-3 rounded-xl bg-amber-600/10 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h6 className="text-white text-xs font-bold uppercase tracking-wider">Verified Auditoriums</h6>
                <p className="text-[11px] text-gray-500 mt-0.5">Dolby Atmos sound and plush VIP recliners</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 text-white font-black text-xl">
              <div className="w-8 h-8 rounded-lg bg-[#e50914] flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span>I<span className="text-[#e50914]">MOVIES</span></span>
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              IMovies delivers the ultimate cinema experience with next-generation audio-visual technology, live seat selection, gourmet concession pre-ordering, and contactless digital ticketing.
            </p>
          </div>

          <div>
            <h6 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Cinemas & Locations</h6>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center space-x-2"><MapPin className="w-3.5 h-3.5 text-[#e50914]" /><span>Mumbai: Lower Parel & Bandra</span></li>
              <li className="flex items-center space-x-2"><MapPin className="w-3.5 h-3.5 text-[#e50914]" /><span>Delhi NCR: DLF CyberHub & Noida</span></li>
              <li className="flex items-center space-x-2"><MapPin className="w-3.5 h-3.5 text-[#e50914]" /><span>Bengaluru: Indiranagar & Whitefield</span></li>
              <li className="flex items-center space-x-2"><MapPin className="w-3.5 h-3.5 text-[#e50914]" /><span>New York: Times Square & Lincoln Square</span></li>
            </ul>
          </div>

          <div>
            <h6 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Cinema Formats</h6>
            <div className="flex flex-wrap gap-2 text-xs">
              {['IMAX Laser 3D', 'Dolby Cinema', '4DX Motion', 'Plush VIP Recliners', 'ScreenX 270°', 'Dolby Atmos 7.1'].map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 text-[11px]">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h6 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Support & Enquiries</h6>
            <div className="space-y-2 text-xs">
              <p className="flex items-center space-x-2"><Phone className="w-3.5 h-3.5 text-gray-400" /><span>24/7 Help Desk: 1800-CINEMA</span></p>
              <p className="flex items-center space-x-2"><Mail className="w-3.5 h-3.5 text-gray-400" /><span>support@imovies-cinema.com</span></p>
              <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-gray-500">
                Demo sandbox payment mode active. No actual debit occurs on card simulator.
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} IMovies Cinema Network. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Refund Policy</span>
            <span>Auditorium Safety</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

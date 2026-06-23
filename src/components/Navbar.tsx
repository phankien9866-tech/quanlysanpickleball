import React from 'react';
import { Calendar, LayoutDashboard, Trophy, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentRole: 'customer' | 'admin';
  setRole: (role: 'customer' | 'admin') => void;
  myBookingsCount: number;
  openMyBookings: () => void;
}

export default function Navbar({
  currentRole,
  setRole,
  myBookingsCount,
  openMyBookings,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/90 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-lime-400 shadow-lg shadow-lime-500/20">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 stroke-[2.5]" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-lime-300 bg-clip-text text-transparent">
                  PicklePro
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-lime-400/10 text-lime-400 border border-lime-400/20">
                  VN
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide">
                Đặt & Quản Lý Sân Thông Minh
              </p>
            </div>
          </div>

          {/* Central Role Toggles */}
          <div className="flex items-center bg-slate-950/60 p-1 sm:p-1.5 rounded-2xl border border-slate-800/80">
            <button
              onClick={() => setRole('customer')}
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                currentRole === 'customer'
                  ? 'bg-lime-400 text-slate-900 shadow-lg shadow-lime-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              id="btn-nav-customer"
            >
              <Calendar className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2]" />
              <span>Đặt Sân</span>
            </button>
            
            <button
              onClick={() => setRole('admin')}
              className={`flex items-center space-x-1 sm:space-x-2 px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                currentRole === 'admin'
                  ? 'bg-lime-400 text-slate-900 shadow-lg shadow-lime-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              id="btn-nav-admin"
            >
              <LayoutDashboard className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2]" />
              <span>Chủ Sân</span>
            </button>
          </div>

          {/* Right Section Tools */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {currentRole === 'customer' ? (
              <button
                onClick={openMyBookings}
                className="relative group flex items-center space-x-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-white transition-all duration-200 cursor-pointer"
                id="btn-nav-history"
              >
                <span className="hidden sm:inline text-slate-300 group-hover:text-white transition-colors">
                  Lịch sử đặt
                </span>
                <span className="flex items-center justify-center w-5 h-5 bg-lime-400 text-slate-950 font-bold text-[11px] rounded-lg shadow-sm">
                  {myBookingsCount}
                </span>
              </button>
            ) : (
              <div className="hidden md:flex items-center space-x-1.5 text-slate-400 font-medium text-xs bg-lime-400/5 border border-lime-400/10 py-1.5 px-3 rounded-lg text-lime-400">
                <Sparkles className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
                <span>Chế độ quản lý v1.0</span>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </header>
  );
}

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CustomerView from './components/CustomerView';
import AdminView from './components/AdminView';
import { Court, Booking, BankConfig } from './types';
import { INITIAL_COURTS, INITIAL_BOOKINGS } from './data';
import { Info, Sparkles, MessageCircle, Lock, Shield, X, Eye, EyeOff, Key, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // 1. Role State: "customer" (Người chơi) vs "admin" (Chủ sân)
  const [role, setRole] = useState<'customer' | 'admin'>('customer');

  // Admin access state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('pb_admin_auth') === 'true';
    } catch (e) {
      return false;
    }
  });
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 2. Database States synchronized with real-time server and localStorage fallback
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [myBookedIds, setMyBookedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pb_my_bookings');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [bankConfig, setBankConfig] = useState<BankConfig>({
    bankName: 'Techcombank',
    accountNumber: '190356789999',
    accountOwner: 'PICKLEPRO',
    qrCodeUrl: '',
  });

  // Booking history view trigger helper state
  const [showMyBookingsModal, setShowMyBookingsModal] = useState(false);

  // Synchronize dynamic lists with the server
  const fetchAllData = async () => {
    try {
      const [resCourts, resBookings, resBank] = await Promise.all([
        fetch('/api/courts').then(r => r.json()),
        fetch('/api/bookings').then(r => r.json()),
        fetch('/api/bank-config').then(r => r.json()),
      ]);

      if (Array.isArray(resCourts)) {
        setCourts(resCourts);
      }
      if (Array.isArray(resBookings)) {
        // Sort bookings by creation date descending
        const sorted = [...resBookings].sort(
          (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        setBookings(sorted);
      }
      if (resBank && resBank.bankName) {
        setBankConfig(resBank);
      }
    } catch (err) {
      console.warn('Network syncing pending / offline:', err);
    }
  };

  // Initial load and fast polling interval (every 3 seconds) for multi-device instant sync
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(() => {
      fetchAllData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Save specific local booking IDs (specific to this customer's browser tab) to localStorage
  useEffect(() => {
    localStorage.setItem('pb_my_bookings', JSON.stringify(myBookedIds));
  }, [myBookedIds]);

  // Intercept role changes and request passwords when accessing the Admin side
  const handleRoleChange = (newRole: 'customer' | 'admin') => {
    if (newRole === 'admin') {
      if (isAdminAuthenticated) {
        setRole('admin');
      } else {
        setShowPasswordModal(true);
        setPasswordInput('');
        setPasswordError('');
      }
    } else {
      setRole('customer');
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsAdminAuthenticated(true);
        try {
          sessionStorage.setItem('pb_admin_auth', 'true');
        } catch (err) {}
        setRole('admin');
        setShowPasswordModal(false);
        setPasswordError('');
        // Force instant refresh on auth
        fetchAllData();
      } else {
        setPasswordError('Mật khẩu của chủ sân không chính xác. Hãy vui lòng thử lại!');
      }
    } catch (err) {
      setPasswordError('Lỗi kết nối máy chủ, vui lòng thử lại!');
    }
  };

  // 3. Customer Operations with optimistic local state + instant server POST
  const handleAddBooking = async (newBooking: Booking | Booking[]) => {
    const bookingsToAdd = Array.isArray(newBooking) ? newBooking : [newBooking];

    // Optimistic local update
    setBookings(prev => [...bookingsToAdd, ...prev]);
    setMyBookedIds(prev => [...bookingsToAdd.map(b => b.id), ...prev]);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error('Error sending booking:', e);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    // Optimistic local update
    setBookings(prev =>
      prev.map(b => b.id === bookingId ? { ...b, status: 'canceled' } : b)
    );

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'canceled' }),
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error('Error changing booking status:', e);
    }
  };

  // 4. Admin Operations
  const handleConfirmBooking = async (bookingId: string | string[]) => {
    const ids = Array.isArray(bookingId) ? bookingId : [bookingId];
    if (ids.length === 0) return;

    // Optimistic local update
    setBookings(prev =>
      prev.map(b => ids.includes(b.id) ? { ...b, status: 'confirmed' as const } : b)
    );

    try {
      let response;
      if (Array.isArray(bookingId)) {
        response = await fetch(`/api/bookings/bulk/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingIds: ids, status: 'confirmed' }),
        });
      } else {
        response = await fetch(`/api/bookings/${bookingId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' }),
        });
      }
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectBooking = async (bookingId: string | string[]) => {
    const ids = Array.isArray(bookingId) ? bookingId : [bookingId];
    if (ids.length === 0) return;

    // Optimistic local update
    setBookings(prev =>
      prev.map(b => ids.includes(b.id) ? { ...b, status: 'canceled' as const } : b)
    );

    try {
      let response;
      if (Array.isArray(bookingId)) {
        response = await fetch(`/api/bookings/bulk/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingIds: ids, status: 'canceled' }),
        });
      } else {
        response = await fetch(`/api/bookings/${bookingId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'canceled' }),
        });
      }
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCourt = async (newCourt: Court) => {
    // Optimistic local update
    setCourts(prev => [...prev, newCourt]);

    try {
      const response = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourt),
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCourt = async (updatedCourt: Court) => {
    // Optimistic local update
    setCourts(prev =>
      prev.map(c => c.id === updatedCourt.id ? updatedCourt : c)
    );

    try {
      const response = await fetch('/api/courts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCourt),
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCourtStatus = async (id: string, status: 'active' | 'maintenance' | 'inactive') => {
    // Optimistic local update
    setCourts(prev =>
      prev.map(c => c.id === id ? { ...c, status } : c)
    );

    try {
      const response = await fetch(`/api/courts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCourt = async (id: string) => {
    // Optimistic local update
    setCourts(prev => prev.filter(c => c.id !== id));

    try {
      const response = await fetch(`/api/courts/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateBankConfig = async (config: BankConfig) => {
    setBankConfig(config);

    try {
      const response = await fetch('/api/bank-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (response.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased text-slate-900 transition-colors duration-300">
      
      {/* Dynamic Header & Switch Desk */}
      <Navbar
        currentRole={role}
        setRole={handleRoleChange}
        myBookingsCount={myBookedIds.length}
        openMyBookings={() => setShowMyBookingsModal(true)}
      />

      {/* Main Body viewports */}
      <main className="flex-grow">
        {role === 'customer' ? (
          <CustomerView
            courts={courts}
            bookings={bookings}
            onAddBooking={handleAddBooking}
            myBookedIds={myBookedIds}
            cancelBooking={handleCancelBooking}
            showMyBookingsModal={showMyBookingsModal}
            setShowMyBookingsModal={setShowMyBookingsModal}
            bankConfig={bankConfig}
          />
        ) : (
          <AdminView
            courts={courts}
            bookings={bookings}
            onConfirmBooking={handleConfirmBooking}
            onRejectBooking={handleRejectBooking}
            onAddCourt={handleAddCourt}
            onUpdateCourt={handleUpdateCourt}
            onUpdateCourtStatus={handleUpdateCourtStatus}
            onDeleteCourt={handleDeleteCourt}
            bankConfig={bankConfig}
            onUpdateBankConfig={handleUpdateBankConfig}
          />
        )}
      </main>

      {/* Footnote Branding details */}
      <footer className="bg-slate-950 text-slate-400 py-10 mt-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Logo copy */}
            <div className="text-center md:text-left space-y-1.5">
              <span className="font-extrabold text-white text-base tracking-tight">
                PicklePoint Việt Nam
              </span>
              <p className="text-xs text-slate-500 leading-normal max-w-sm">
                Ứng dụng hiện đại hóa phong trào Pickleball toàn quốc. Tối ưu hóa hiệu năng khai thác sân cho chủ doanh nghiệp thể thao.
              </p>
            </div>

            {/* Quick tips bar */}
            <div className="flex items-center space-x-2.5 text-xs text-slate-500 font-medium bg-slate-900 p-3 rounded-2xl border border-slate-800/80">
              <Sparkles className="w-4 h-4 text-lime-400 shrink-0" />
              <span>Thử nghiệm đặt sân ở tab một và duyệt nó lập tức ở tab Chủ Sân để xem dòng tiền cập nhật nhé!</span>
            </div>

            {/* Copyright */}
            <div className="text-center md:text-right text-xs text-slate-500">
              <p>© 2026 PicklePoint Inc. Bảo lưu mọi quyền.</p>
              <p className="mt-1">Thiết kế bởi Đội ngũ Kiến trúc sáng tạo.</p>
            </div>
            
          </div>
        </div>
      </footer>

      {/* ADMIN PASSCODE CHALLENGE MODAL */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Backdrop blur effect */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowPasswordModal(false);
                setRole('customer');
              }}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            />

            {/* Verification Content box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8"
            >
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setRole('customer');
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-lime-100 text-slate-900 rounded-2xl flex items-center justify-center shadow-inner">
                  <Lock className="w-7 h-7 stroke-[2.2]" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Khu Vực Cho Chủ Sân</h3>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Vui lòng cung cấp chính xác mật khẩu quản lý để tiếp tục vào bảng kiểm soát tài chính & thiết lập sân.
                  </p>
                </div>

                <form onSubmit={handleVerifyPassword} className="w-full space-y-4 pt-2">
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Key className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder="Nhập mật khẩu chủ sân..."
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 focus:border-slate-400 rounded-xl text-sm font-semibold outline-none transition-all focus:ring-1 focus:ring-slate-400 tracking-wide text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-900 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>

                  {passwordError && (
                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start space-x-2 text-left">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-rose-600 font-bold leading-relaxed">{passwordError}</span>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setRole('customer');
                      }}
                      className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      Xác minh
                    </button>
                  </div>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

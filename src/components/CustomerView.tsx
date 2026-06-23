import React, { useState, useMemo } from 'react';
import { Court, Booking, TimeSlotConfig, BankConfig } from '../types';
import { TIME_SLOTS } from '../data';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  ChevronRight, 
  X, 
  Phone, 
  User, 
  FileText, 
  CreditCard, 
  Calendar as CalendarIcon,
  Star,
  Layers,
  Sun,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerViewProps {
  courts: Court[];
  bookings: Booking[];
  onAddBooking: (booking: Booking) => void;
  myBookedIds: string[];
  cancelBooking: (bookingId: string) => void;
  showMyBookingsModal: boolean;
  setShowMyBookingsModal: (show: boolean) => void;
  bankConfig: BankConfig;
}

export default function CustomerView({
  courts,
  bookings,
  onAddBooking,
  myBookedIds,
  cancelBooking,
  showMyBookingsModal,
  setShowMyBookingsModal,
  bankConfig
}: CustomerViewProps) {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [courtType, setCourtType] = useState<'all' | 'indoor' | 'outdoor'>('all');
  const [hasRoof, setHasRoof] = useState(false);
  const [hasLights, setHasLights] = useState(false);
  const [selectedSort, setSelectedSort] = useState<'rating' | 'priceAsc' | 'priceDesc'>('rating');

  // Booking Modal State
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  
  // Date selection state: Default is today
  const getDates = () => {
    const dates = [];
    const vietnameseDays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dateVal}`;
      
      let label = `${dateVal}/${month}`;
      let dayName = vietnameseDays[d.getDay()];
      if (i === 0) dayName = 'Hôm nay';
      if (i === 1) dayName = 'Ngày mai';
      
      dates.push({ dateString, label, dayName });
    }
    return dates;
  };

  const bookingDates = useMemo(() => getDates(), []);
  const [selectedDate, setSelectedDate] = useState(bookingDates[0].dateString);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'at_court' | 'bank_transfer'>('at_court');
  const [isSuccessBooked, setIsSuccessBooked] = useState(false);
  const [newBookingDetails, setNewBookingDetails] = useState<Booking | null>(null);

  // Filter Court logic
  const filteredCourts = useMemo(() => {
    return courts
      .filter((court) => {
        if (court.status !== 'active') return false;
        
        const matchesSearch = 
          court.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          court.location.toLowerCase().includes(searchTerm.toLowerCase());
          
        const matchesType = courtType === 'all' || court.type === courtType;
        const matchesRoof = !hasRoof || court.hasRoof;
        const matchesLights = !hasLights || court.hasLights;
        
        return matchesSearch && matchesType && matchesRoof && matchesLights;
      })
      .sort((a, b) => {
        if (selectedSort === 'rating') return b.rating - a.rating;
        if (selectedSort === 'priceAsc') return a.priceDaytime - b.priceDaytime;
        if (selectedSort === 'priceDesc') return b.priceDaytime - a.priceDaytime;
        return 0;
      });
  }, [courts, searchTerm, courtType, hasRoof, hasLights, selectedSort]);

  // Check if a time slot is already booked for the selected court and selected date
  const getUnavailableSlots = (courtId: string, date: string) => {
    return bookings
      .filter(b => b.courtId === courtId && b.date === date && b.status !== 'canceled')
      .map(b => b.timeSlot);
  };

  const unavailableSlots = selectedCourt 
    ? getUnavailableSlots(selectedCourt.id, selectedDate) 
    : [];

  const handleOpenBooking = (court: Court) => {
    setSelectedCourt(court);
    setSelectedSlot(null);
    setIsSuccessBooked(false);
    setNewBookingDetails(null);
  };

  const handleCloseBooking = () => {
    setSelectedCourt(null);
    setSelectedSlot(null);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourt || !selectedSlot) return;

    // Determine slot configuration
    const matchingConfig = TIME_SLOTS.find(s => `${s.start} - ${s.end}` === selectedSlot);
    const isEvening = matchingConfig?.isEvening || false;
    const price = isEvening ? selectedCourt.priceEvening : selectedCourt.priceDaytime;

    const newBooking: Booking = {
      id: 'booking-' + Date.now(),
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      customerName: fullName,
      customerPhone: phoneNumber,
      date: selectedDate,
      timeSlot: selectedSlot,
      totalPrice: price,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
      paymentMethod,
    };

    onAddBooking(newBooking);
    setNewBookingDetails(newBooking);
    setIsSuccessBooked(true);
    
    // Reset form states for next bookings
    setNotes('');
  };

  // Find users individual booking history records
  const myBookingsList = useMemo(() => {
    return bookings.filter(b => myBookedIds.includes(b.id));
  }, [bookings, myBookedIds]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Intro Banner */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-6 sm:p-10 mb-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-lime-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-lime-400/10 border border-lime-400/20 text-lime-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mùa thi đấu Pickleball Việt Nam 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Hệ Thống Đặt Sân <span className="text-lime-400">Chuyên Nghiệp</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Tìm kiếm sân trống gần nhất, đặt chỗ trực quan trong vòng 60 giây và bắt đầu buổi tập thể thao tăng cường năng lượng, sảng khoái cơ thể!
          </p>
        </div>
      </div>

      {/* Main Filter and Directory Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filters Panel - Sidebar */}
        <div className="lg:col-span-1 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-lime-500" />
              <span>Bộ lọc thông minh</span>
            </h3>
            {(searchTerm || courtType !== 'all' || hasRoof || hasLights) && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setCourtType('all');
                  setHasRoof(false);
                  setHasLights(false);
                }}
                className="text-xs font-bold text-lime-600 hover:text-lime-700 hover:underline"
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tìm kiếm sân</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tên sân, địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 focus:border-lime-500 transition-all"
              />
            </div>
          </div>

          {/* Court Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Loại sân</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'indoor', 'outdoor'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setCourtType(t)}
                  className={`text-xs font-semibold py-1.5 rounded-lg transition-all ${
                    courtType === t 
                      ? 'bg-white text-slate-950 shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'all' ? 'Tất cả' : t === 'indoor' ? 'Trong nhà' : 'Ngoài trời'}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities checklist */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tiện ích tối thiểu</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasRoof}
                  onChange={(e) => setHasRoof(e.target.checked)}
                  className="rounded border-slate-300 text-lime-500 focus:ring-lime-400 accent-lime-500"
                />
                <span>Có mái che mưa nắng</span>
              </label>
              
              <label className="flex items-center space-x-2.5 text-sm font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasLights}
                  onChange={(e) => setHasLights(e.target.checked)}
                  className="rounded border-slate-300 text-lime-500 focus:ring-lime-400 accent-lime-500"
                />
                <span>Hệ thống chiếu sáng đêm</span>
              </label>
            </div>
          </div>

          {/* Sort selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sắp xếp theo</label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400/50 transition-all"
            >
              <option value="rating">Được đánh giá cao nhất</option>
              <option value="priceAsc">Giá ban ngày: Thấp đến Cao</option>
              <option value="priceDesc">Giá ban ngày: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* Action Court Cards Collection */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Danh sách sân rảnh ({filteredCourts.length})
            </h2>
          </div>

          {filteredCourts.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-12 border border-slate-200/80 text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Không tìm thấy sân nào</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc giảm bớt các tiêu chí lọc tiện nghi để tìm được sân phù hợp nhé!
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCourtType('all');
                  setHasRoof(false);
                  setHasLights(false);
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Nhập lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCourts.map((court) => (
                <div 
                  key={court.id}
                  className="group bg-white border border-slate-200/70 hover:border-lime-500/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col h-full"
                >
                  {/* Photo area */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img 
                      src={court.image} 
                      alt={court.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-bold text-xs flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 text-lime-400 fill-lime-400" />
                      <span>{court.rating}</span>
                    </div>

                    <div className="absolute top-3 right-3 flex space-x-1.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md ${
                        court.type === 'indoor' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-lime-400 text-slate-900'
                      }`}>
                        {court.type === 'indoor' ? 'Trong nhà' : 'Ngoài trời'}
                      </span>
                    </div>
                  </div>

                  {/* Info area */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-lime-600 transition-colors">
                        {court.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-start space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{court.location}</span>
                      </p>
                      
                      {/* Amenities checklist render */}
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {court.hasRoof && (
                          <span className="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-xs border border-slate-200/50">
                            🌧️ Có mái che
                          </span>
                        )}
                        {court.hasLights && (
                          <span className="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-xs border border-slate-200/50">
                            💡 Đèn LED đêm
                          </span>
                        )}
                      </div>
                      
                      <p className="text-slate-600 text-xs line-clamp-2 pt-1 font-medium leading-relaxed">
                        {court.description}
                      </p>
                    </div>

                    {/* Pricing details and Action */}
                    <div className="border-t border-slate-100 mt-4 pt-4 flex items-end justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Giá thuê từ</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-lg font-extrabold text-slate-900">
                            {court.priceDaytime.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-xs text-slate-500 font-bold">/ giờ</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleOpenBooking(court)}
                        className="py-2.5 px-4 bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center space-x-2.5 transition-all hover:bg-lime-400 hover:text-slate-900 shadow-sm"
                        id={`btn-book-${court.id}`}
                      >
                        <span>Đặt Sân Ngay</span>
                        <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Play Court Booking Modal / Checkout Panel */}
      <AnimatePresence>
        {selectedCourt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseBooking}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Card Content container */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
            >
              
              {/* Left Column: Court Info & Highlights */}
              <div className="md:w-5/12 bg-slate-950 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-y-auto border-r border-slate-800/80">
                <div className="space-y-4">
                  <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-800">
                    <img 
                      src={selectedCourt.image} 
                      alt={selectedCourt.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div>
                    <span className="inline-block bg-lime-400 text-slate-900 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg mb-2">
                      {selectedCourt.type === 'indoor' ? 'Trong nhà' : 'Ngoài trời'}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">
                      {selectedCourt.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 flex items-start space-x-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                      <MapPin className="w-3.5 h-3.5 text-lime-400 shrink-0 mt-0.5" />
                      <span>{selectedCourt.location}</span>
                    </p>
                  </div>

                  <ul className="space-y-2 bg-slate-900 border border-slate-800/80 p-4 rounded-xl text-xs text-slate-300">
                    <li className="flex justify-between">
                      <span className="text-slate-400 font-semibold">☀️ Giờ sáng - chiều:</span>
                      <span className="font-bold text-lime-400">{selectedCourt.priceDaytime.toLocaleString('vi-VN')} VNĐ</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-400 font-semibold">🌙 Giờ tối cao điểm:</span>
                      <span className="font-bold text-lime-400">{selectedCourt.priceEvening.toLocaleString('vi-VN')} VNĐ</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-lime-400 font-semibold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Hệ thống bảo đảm tin cậy</span>
                  </div>
                  <p className="text-slate-500 leading-normal">
                    Đặt sân nhanh trực tiếp, thông tin ngay lập tức cập nhật tới ban quản lý sân và hiển thị trên lịch điều khiển của sân.
                  </p>
                </div>
              </div>

              {/* Right Column: Checkout Interactive Steps Form */}
              <div className="md:w-7/12 p-6 sm:p-8 flex flex-col overflow-y-auto max-h-[90vh] sm:max-h-none bg-white">
                <button 
                  onClick={handleCloseBooking}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full z-10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {!isSuccessBooked ? (
                  <form onSubmit={handleSubmitBooking} className="space-y-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h4 className="text-lg font-extrabold text-slate-900 border-b border-slate-100 pb-2">
                        Chi tiết lịch và Thông tin đặt sân
                      </h4>

                      {/* 1. Date Selector Cards list */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center space-x-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>1. Chọn Ngày chơi</span>
                        </label>
                        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                          {bookingDates.map((d) => (
                            <button
                              key={d.dateString}
                              type="button"
                              onClick={() => {
                                setSelectedDate(d.dateString);
                                setSelectedSlot(null);
                              }}
                              className={`flex-shrink-0 flex flex-col items-center justify-center p-2.5 w-22 rounded-xl border transition-all ${
                                selectedDate === d.dateString
                                  ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-md'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <span className="text-[10px] uppercase font-bold tracking-tight opacity-75">{d.dayName}</span>
                              <span className="text-sm font-extrabold mt-1">{d.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Visual Slots categorized under groups */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>2. Chọn khung giờ trống (1 giờ / slot)</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold italic text-right">
                            Màu xám: Đã có người đặt
                          </span>
                        </label>

                        {/* Morning & Afternoon - Evening categories */}
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1 p-2 bg-slate-50 rounded-2xl border border-slate-200/50">
                          
                          {/* Morning category */}
                          <div className="space-y-1.5">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center space-x-1 px-1">
                              <Sun className="w-3 h-3 text-amber-500" />
                              <span>Ban Ngày (05:00 - 15:00)</span>
                            </h5>
                            <div className="grid grid-cols-3 gap-1.5">
                              {TIME_SLOTS.filter(s => !s.isEvening).map((slot) => {
                                const slotString = `${slot.start} - ${slot.end}`;
                                const isBooked = unavailableSlots.includes(slotString);
                                const isSelected = selectedSlot === slotString;
                                return (
                                  <button
                                    key={slotString}
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => setSelectedSlot(slotString)}
                                    className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center ${
                                      isBooked 
                                        ? 'bg-slate-200 text-slate-400 border-slate-200 line-through cursor-not-allowed' 
                                        : isSelected
                                          ? 'bg-lime-400 border-lime-400 text-slate-900 font-extrabold shadow-sm'
                                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80'
                                    }`}
                                  >
                                    <span>{slotString}</span>
                                    <span className="text-[9px] opacity-75 font-medium">{selectedCourt.priceDaytime.toLocaleString('vi-VN')}đ</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Evening / Afternoon category */}
                          <div className="space-y-1.5 pt-1">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center space-x-1 px-1">
                              <span>🌙 Khung Giờ Cao Điểm (16:00 - 22:00)</span>
                            </h5>
                            <div className="grid grid-cols-3 gap-1.5">
                              {TIME_SLOTS.filter(s => s.isEvening).map((slot) => {
                                const slotString = `${slot.start} - ${slot.end}`;
                                const isBooked = unavailableSlots.includes(slotString);
                                const isSelected = selectedSlot === slotString;
                                return (
                                  <button
                                    key={slotString}
                                    type="button"
                                    disabled={isBooked}
                                    onClick={() => setSelectedSlot(slotString)}
                                    className={`py-2 px-1 text-[11px] sm:text-xs font-bold rounded-lg border transition-all flex flex-col items-center justify-center ${
                                      isBooked 
                                        ? 'bg-slate-200 text-slate-400 border-slate-200 line-through cursor-not-allowed' 
                                        : isSelected
                                          ? 'bg-lime-400 border-lime-400 text-slate-900 font-extrabold shadow-sm'
                                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/80'
                                    }`}
                                  >
                                    <span>{slotString}</span>
                                    <span className="text-[9px] opacity-75 font-medium">{selectedCourt.priceEvening.toLocaleString('vi-VN')}đ</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Personal detail form */}
                      <div className="space-y-3 pt-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center space-x-1">
                          <User className="w-3.5 h-3.5" />
                          <span>3. Thông tin liên hệ nhận sân</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <div className="relative">
                              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                required
                                placeholder="Họ và tên người chơi *"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/30 transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <input
                                type="tel"
                                required
                                pattern="[0-9]{9,11}"
                                placeholder="Số điện thoại cá nhân (9-11 số) *"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/30 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="relative">
                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Ghi chú thêm (ví dụ: mượn bóng tập, thuê 2 vợt, hướng dẫn viên...)"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/30 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. Payment Options selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center space-x-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>4. Chọn Phương thức thanh toán</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <label className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-all ${
                            paymentMethod === 'at_court'
                              ? 'bg-lime-50/50 border-lime-400 text-lime-900 font-semibold'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'at_court'}
                              onChange={() => setPaymentMethod('at_court')}
                              className="accent-lime-500 focus:ring-lime-400"
                            />
                            <div className="text-xs">
                              <p className="font-bold text-slate-800">Thanh toán tại sân</p>
                              <p className="text-[10px] text-slate-500">Đến sân trả sau</p>
                            </div>
                          </label>

                          <label className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-all ${
                            paymentMethod === 'bank_transfer'
                              ? 'bg-lime-50/50 border-lime-400 text-lime-900 font-semibold'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                          }`}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              checked={paymentMethod === 'bank_transfer'}
                              onChange={() => setPaymentMethod('bank_transfer')}
                              className="accent-lime-500 focus:ring-lime-400"
                            />
                            <div className="text-xs">
                              <p className="font-bold text-slate-800">Chuyển khoản Banking</p>
                              <p className="text-[10px] text-slate-500">Nhận thông tin QR</p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Footer price and check out button */}
                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                      <div>
                        {selectedSlot ? (
                          <div className="text-xs text-slate-500">
                            Khung giờ đã chọn: <span className="font-bold text-slate-900">{selectedSlot}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-rose-500 font-medium">Vui lòng chọn khung giờ</div>
                        )}
                      </div>
                      
                      <button
                        type="submit"
                        disabled={!selectedSlot || !fullName || !phoneNumber}
                        className={`py-3 px-6 rounded-xl font-bold text-sm tracking-tight transition-all text-center flex items-center space-x-2.5 ${
                          selectedSlot && fullName && phoneNumber
                            ? 'bg-slate-900 text-white hover:bg-lime-400 hover:text-slate-900 cursor-pointer shadow-lg'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                        id="btn-sub-booking"
                      >
                        <span>Xác Nhận Đặt Sân</span>
                        <CheckCircle className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  // Success State rendering
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 bg-white">
                    <div className="w-16 h-16 bg-lime-400 text-slate-900 rounded-full flex items-center justify-center shadow-lg shadow-lime-400/20">
                      <CheckCircle className="w-10 h-10 stroke-[2.5]" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">ĐẶT SÂN THÀNH CÔNG!</h3>
                      <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        Mã đơn đặt sân của bạn đã được ghi nhận trên hệ thống và đang chờ xác nhận từ ban quản lý sân!
                      </p>
                    </div>

                    {newBookingDetails && (
                      <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2.5 text-left text-slate-600">
                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                          <span className="font-bold text-slate-800">Sân của bạn:</span>
                          <span className="font-semibold text-slate-900">{newBookingDetails.courtName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ngày chơi:</span>
                          <span className="font-bold text-slate-900">
                            {VietnameseFormatDate(newBookingDetails.date)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Khung giờ:</span>
                          <span className="font-bold text-slate-900">{newBookingDetails.timeSlot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Khách hàng:</span>
                          <span className="font-bold text-slate-900">{newBookingDetails.customerName}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200/60 pt-2 text-sm">
                          <span className="font-extrabold text-slate-800">Tổng phí thanh toán:</span>
                          <span className="font-black text-lime-600">
                            {newBookingDetails.totalPrice.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'bank_transfer' && (
                      <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-left text-slate-700 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                        <div className="w-28 h-28 shrink-0 bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-center overflow-hidden shadow-inner">
                          <img
                            src={bankConfig.qrCodeUrl || `https://img.vietqr.io/image/${bankConfig.bankName}-${bankConfig.accountNumber}-compact.jpg?accountName=${encodeURIComponent(bankConfig.accountOwner)}&addInfo=${encodeURIComponent('Dat san ' + (newBookingDetails?.customerPhone || 'Pickleball'))}`}
                            alt="Mã QR thanh toán ngân hàng"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 space-y-1.5 w-full">
                          <p className="font-extrabold text-slate-900 border-b border-slate-200/60 pb-1 flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-lime-600" />
                            <span>Thông tin chuyển khoản an toàn</span>
                          </p>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ngân hàng</span>
                              <span className="font-bold text-slate-800 uppercase text-xs">{bankConfig.bankName}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Số tài khoản</span>
                              <span className="font-extrabold text-slate-900 font-mono tracking-wider text-xs select-all bg-slate-100 px-1 rounded">{bankConfig.accountNumber}</span>
                            </div>
                            <div className="col-span-2 pt-1 border-t border-slate-200/30">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Chủ tài khoản</span>
                              <span className="font-black text-slate-800 uppercase text-xs">{bankConfig.accountOwner}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal pt-1 italic">
                            Vui lòng quét mã QR hoặc chuyển khoản đúng cú pháp để đơn được phê duyệt tự động.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3 w-full">
                      <button
                        onClick={handleCloseBooking}
                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        Đóng và tiếp tục xem
                      </button>
                      <button
                        onClick={() => {
                          handleCloseBooking();
                          setShowMyBookingsModal(true);
                        }}
                        className="flex-1 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Xem Lịch sử của tôi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: User Booking History Modal */}
      <AnimatePresence>
        {showMyBookingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMyBookingsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col max-h-[85vh]"
            >
              <button 
                onClick={() => setShowMyBookingsModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full z-10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-lime-100 text-slate-900 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Lịch sử đặt sân của tôi</h3>
                    <p className="text-xs text-slate-400">Xem, theo dõi trạng thái hoặc hủy lịch đặt sân</p>
                  </div>
                </div>
              </div>

              {/* Booking Cards scroll list */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {myBookingsList.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <p className="text-slate-400 text-sm">Bạn chưa thực hiện giao dịch đặt sân nào trên trình duyệt này.</p>
                    <button
                      onClick={() => setShowMyBookingsModal(false)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Bắt đầu đặt sân ngay
                    </button>
                  </div>
                ) : (
                  myBookingsList.map((booking) => (
                    <div 
                      key={booking.id}
                      className="border border-slate-200 rounded-2xl p-4 hover:border-slate-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{booking.courtName}</h4>
                          <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-medium border border-slate-200/50">
                              📅 {VietnameseFormatDate(booking.date)}
                            </span>
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-800 border border-slate-200/50">
                              🕒 {booking.timeSlot}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            booking.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : booking.status === 'canceled'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {booking.status === 'confirmed' ? 'Đã duyệt' : booking.status === 'canceled' ? 'Đã hủy' : 'Đang duyệt'}
                          </span>
                        </div>
                      </div>

                      {/* Notes & pricing info */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs sm:text-sm text-slate-600 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Thông tin thanh toán</p>
                          <p className="font-extrabold text-slate-900">
                            {booking.totalPrice.toLocaleString('vi-VN')} VNĐ
                          </p>
                        </div>
                        {booking.notes && (
                          <div className="text-left border-l border-slate-200 pl-3">
                            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Ghi chú</p>
                            <p className="text-slate-700 italic max-w-xs truncate font-medium">"{booking.notes}"</p>
                          </div>
                        )}
                      </div>

                      {/* Cancel Booking Action if and only if not already canceled */}
                      {booking.status !== 'canceled' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              if (window.confirm('Bạn có chắc chắn muốn hủy yêu cầu đặt sân này không?')) {
                                cancelBooking(booking.id);
                              }
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                          >
                            Yêu cầu hủy lịch sân
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Total booked calculation summary footer */}
              <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-center bg-white">
                <span className="text-xs text-slate-400 font-semibold">Tự động đồng bộ với Ban quản trị</span>
                <button
                  onClick={() => setShowMyBookingsModal(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 transition-colors text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple Helper function to format date strings into Vietnamese friendly format
function VietnameseFormatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`;
}

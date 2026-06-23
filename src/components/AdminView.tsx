import React, { useState, useMemo } from 'react';
import { Court, Booking, BankConfig } from '../types';
import { TIME_SLOTS } from '../data';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Check, 
  X, 
  Plus, 
  FileText, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Settings, 
  Info, 
  PlusCircle, 
  Layers, 
  Activity, 
  Trash2, 
  Trash,
  Sliders,
  CheckCircle,
  HelpCircle,
  Award,
  CreditCard,
  Upload,
  Image as ImageIcon,
  Lock,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminViewProps {
  courts: Court[];
  bookings: Booking[];
  onConfirmBooking: (bookingId: string) => void;
  onRejectBooking: (bookingId: string) => void;
  onAddCourt: (court: Court) => void;
  onUpdateCourt: (court: Court) => void;
  onUpdateCourtStatus: (id: string, status: 'active' | 'maintenance' | 'inactive') => void;
  onDeleteCourt: (id: string) => void;
  bankConfig: BankConfig;
  onUpdateBankConfig: (config: BankConfig) => void;
}

export default function AdminView({
  courts,
  bookings,
  onConfirmBooking,
  onRejectBooking,
  onAddCourt,
  onUpdateCourt,
  onUpdateCourtStatus,
  onDeleteCourt,
  bankConfig,
  onUpdateBankConfig
}: AdminViewProps) {
  
  const [activeTab, setActiveTab ] = useState<'bookings' | 'courts' | 'stats' | 'settings'>('bookings');
  
  // Create state for registering a new court
  const [showAddCourtModal, setShowAddCourtModal] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [newCourtLocation, setNewCourtLocation] = useState('140 - Nguyễn Văn Cừ - Đồng Hới - Quảng Trị');
  const [newCourtType, setNewCourtType] = useState<'indoor' | 'outdoor'>('indoor');
  const [newCourtRoof, setNewCourtRoof] = useState(true);
  const [newCourtLights, setNewCourtLights] = useState(true);
  const [newCourtPriceDay, setNewCourtPriceDay] = useState(120000);
  const [newCourtPriceEve, setNewCourtPriceEve] = useState(180000);
  const [newCourtDesc, setNewCourtDesc] = useState('');
  const [newCourtImg, setNewCourtImg] = useState('https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800');
  const [newCourtCount, setNewCourtCount] = useState<number>(1);

  // Edit Court states
  const [showEditCourtModal, setShowEditCourtModal] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [editCourtName, setEditCourtName] = useState('');
  const [editCourtLocation, setEditCourtLocation] = useState('');
  const [editCourtType, setEditCourtType] = useState<'indoor' | 'outdoor'>('indoor');
  const [editCourtRoof, setEditCourtRoof] = useState(true);
  const [editCourtLights, setEditCourtLights] = useState(true);
  const [editCourtPriceDay, setEditCourtPriceDay] = useState(120000);
  const [editCourtPriceEve, setEditCourtPriceEve] = useState(180000);
  const [editCourtDesc, setEditCourtDesc] = useState('');
  const [editCourtImg, setEditCourtImg] = useState('');
  const [editCourtCount, setEditCourtCount] = useState<number>(1);

  // Local settings form state for Bank config
  const [localBankName, setLocalBankName] = useState(bankConfig.bankName || '');
  const [localAccountNumber, setLocalAccountNumber] = useState(bankConfig.accountNumber || '');
  const [localAccountOwner, setLocalAccountOwner] = useState(bankConfig.accountOwner || '');
  const [localQrCodeUrl, setLocalQrCodeUrl] = useState(bankConfig.qrCodeUrl || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Password modify state variables
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaveStatus, setPwdSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pwdMsg, setPwdMsg] = useState('');

  // Compute if the local form state matches the current props from the parent (server state)
  const isFormMatchingProps =
    localBankName === (bankConfig.bankName || '') &&
    localAccountNumber === (bankConfig.accountNumber || '') &&
    localAccountOwner === (bankConfig.accountOwner || '') &&
    localQrCodeUrl === (bankConfig.qrCodeUrl || '');

  // Once the parent's props catch up with what we entered, clear the dirty flag!
  React.useEffect(() => {
    if (isFormMatchingProps) {
      setIsDirty(false);
    }
  }, [isFormMatchingProps]);

  // Keep local fields in sync with server values when bankConfig updates from outside, but only if user hasn't edited anything
  React.useEffect(() => {
    if (!isDirty) {
      setLocalBankName(bankConfig.bankName || '');
      setLocalAccountNumber(bankConfig.accountNumber || '');
      setLocalAccountOwner(bankConfig.accountOwner || '');
      setLocalQrCodeUrl(bankConfig.qrCodeUrl || '');
    }
  }, [bankConfig, isDirty]);

  // Handle file import and conversion to Base64
  const processQrImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng tải lên một tệp hình ảnh hợp lệ (PNG, JPG, JPEG)!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setLocalQrCodeUrl(e.target.result);
        setIsDirty(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processQrImageFile(e.target.files[0]);
    }
  };

  const handleQrDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleQrDragLeave = () => {
    setIsDragging(false);
  };

  const handleQrDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processQrImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSaveBankConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      onUpdateBankConfig({
        bankName: localBankName.trim(),
        accountNumber: localAccountNumber.replace(/\s+/g, ''),
        accountOwner: localAccountOwner.trim().toUpperCase(),
        qrCodeUrl: localQrCodeUrl.trim()
      });
      setSaveStatus('saved');
      // We do not set isDirty to false here synchronously.
      // We let the useEffect wait for the parent component to receive the updated values via polling and trigger isFormMatchingProps === true.
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.trim() !== confirmPwd.trim()) {
      setPwdMsg('Mật khẩu nhập lại không khớp!');
      setPwdSaveStatus('error');
      setTimeout(() => {
        setPwdSaveStatus('idle');
        setPwdMsg('');
      }, 3000);
      return;
    }
    if (newPwd.trim().length === 0) {
      setPwdMsg('Mật khẩu không được bỏ trống!');
      setPwdSaveStatus('error');
      setTimeout(() => {
        setPwdSaveStatus('idle');
        setPwdMsg('');
      }, 3000);
      return;
    }

    setPwdSaveStatus('saving');
    try {
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPwd.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPwdSaveStatus('saved');
        setPwdMsg('Đã cập nhật mật khẩu mới của chủ sân thành công!');
        setNewPwd('');
        setConfirmPwd('');
        setTimeout(() => {
          setPwdSaveStatus('idle');
          setPwdMsg('');
        }, 3000);
      } else {
        setPwdSaveStatus('error');
        setPwdMsg(data.message || 'Có lỗi xảy ra khi lưu mật khẩu!');
        setTimeout(() => {
          setPwdSaveStatus('idle');
          setPwdMsg('');
        }, 3000);
      }
    } catch (err) {
      setPwdSaveStatus('error');
      setPwdMsg('Lỗi kết nối máy chủ!');
      setTimeout(() => {
        setPwdSaveStatus('idle');
        setPwdMsg('');
      }, 3000);
    }
  };

  const handleStartEditCourt = (court: Court) => {
    setEditingCourt(court);
    setEditCourtName(court.name);
    setEditCourtLocation(court.location);
    setEditCourtType(court.type);
    setEditCourtRoof(court.hasRoof);
    setEditCourtLights(court.hasLights);
    setEditCourtPriceDay(court.priceDaytime);
    setEditCourtPriceEve(court.priceEvening);
    setEditCourtDesc(court.description);
    setEditCourtImg(court.image);
    setEditCourtCount(court.courtCount || 1);
    setShowEditCourtModal(true);
  };

  const handleSaveEditCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt || !editCourtName || !editCourtLocation) return;

    const updated: Court = {
      ...editingCourt,
      name: editCourtName,
      location: editCourtLocation,
      type: editCourtType,
      hasRoof: editCourtRoof,
      hasLights: editCourtLights,
      priceDaytime: Number(editCourtPriceDay),
      priceEvening: Number(editCourtPriceEve),
      description: editCourtDesc.trim(),
      image: editCourtImg || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800',
      courtCount: Number(editCourtCount),
    };

    onUpdateCourt(updated);
    setShowEditCourtModal(false);
    setEditingCourt(null);
  };

  // Booking Filters state for owner
  const [bookingFilterStatus, setBookingFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'canceled'>('all');
  const [bookingFilterCourt, setBookingFilterCourt] = useState<'all' | string>('all');
  const [bookingFilterDate, setBookingFilterDate] = useState<string>('');

  // 1. Math Statistics computations
  const stats = useMemo(() => {
    const activeBookings = bookings.filter(b => b.status !== 'canceled');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    
    // Total Revenue from confirmed bookings only
    const totalRev = confirmedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    
    // Total orders count
    const totalOrders = bookings.length;
    
    // Core statistics
    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const approvalRate = totalOrders > 0 
      ? Math.round((confirmedBookings.length / totalOrders) * 100) 
      : 100;
      
    // Quick estimation of court occupancy (How many bookings placed today relative to operational size)
    // Formula: (confirmed bookings for today) / (active courts * slots available) 
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookingsCount = bookings.filter(b => b.date === todayStr && b.status === 'confirmed').length;
    const totalPossibleSlots = (courts.filter(c => c.status === 'active').length || 1) * TIME_SLOTS.length;
    const occupancyRate = Math.min(Math.round((todayBookingsCount / totalPossibleSlots) * 100), 100);

    return {
      totalRev,
      totalOrders,
      pendingCount,
      approvalRate,
      occupancyRate,
      todayConfirmed: todayBookingsCount
    };
  }, [bookings, courts]);

  // Compute Revenue per court breakdown for graphs/bars
  const courtRevenueData = useMemo(() => {
    const data: { [key: string]: { name: string; revenue: number; count: number } } = {};
    
    // Prefill all courts
    courts.forEach(c => {
      data[c.id] = { name: c.name, revenue: 0, count: 0 };
    });

    // Populate revenue data
    bookings.forEach(b => {
      if (b.status === 'confirmed' && data[b.courtId]) {
        data[b.courtId].revenue += b.totalPrice;
        data[b.courtId].count += 1;
      }
    });

    return Object.values(data);
  }, [bookings, courts]);

  // Filter Bookings list for display
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = bookingFilterStatus === 'all' || b.status === bookingFilterStatus;
      const matchCourt = bookingFilterCourt === 'all' || b.courtId === bookingFilterCourt;
      const matchDate = !bookingFilterDate || b.date === bookingFilterDate;
      return matchStatus && matchCourt && matchDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, bookingFilterStatus, bookingFilterCourt, bookingFilterDate]);

  const handleCreateCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourtName || !newCourtLocation) return;

    const newCourt: Court = {
      id: 'court-' + Date.now(),
      name: newCourtName,
      location: newCourtLocation,
      type: newCourtType,
      hasRoof: newCourtRoof,
      hasLights: newCourtLights,
      priceDaytime: Number(newCourtPriceDay),
      priceEvening: Number(newCourtPriceEve),
      rating: 4.8,
      image: newCourtImg || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800',
      description: newCourtDesc.trim() || 'Sân pickleball được thiết kế hiện đại, đạt tiêu chuẩn chất lượng cao, phục vụ mọi đối tượng người chơi.',
      status: 'active',
      courtCount: Number(newCourtCount || 1)
    };

    onAddCourt(newCourt);
    
    // Clear and close
    setNewCourtName('');
    setNewCourtLocation('140 - Nguyễn Văn Cừ - Đồng Hới - Quảng Trị');
    setNewCourtDesc('');
    setNewCourtImg('https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800');
    setNewCourtCount(1);
    setShowAddCourtModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Upper Statistics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        
        {/* Metric Card 1: Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Doanh Thu Thực Nhận</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {stats.totalRev.toLocaleString('vi-VN')}đ
            </span>
            <p className="text-[10px] text-emerald-500 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              <span>Chuyển khoản / Mặt đất</span>
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Metric Card 2: Pending indicator */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Đại diện Chờ Duyệt</span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">
              {stats.pendingCount} đơn
            </span>
            <p className="text-[10px] text-slate-500 font-medium">
              Vui lòng xem xét duyệt kịp thời
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Metric Card 3: Utilization Occupancy rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1 font-sans">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Hiệu Suất Sân Hôm Nay</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {stats.occupancyRate}%
            </span>
            <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div className="bg-slate-900 h-full rounded-full" style={{ width: `${stats.occupancyRate}%` }}></div>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Metric Card 4: Total transactions */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Tỷ lệ duyệt booking</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {stats.approvalRate}%
            </span>
            <p className="text-[10px] text-slate-500 font-semibold font-sans">
              Tổng số lượng: {stats.totalOrders} lượt đặt
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Primary Workspace Nav Tabs */}
      <div className="flex border-b border-slate-200 mb-8 space-x-6">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-4 text-xs sm:text-sm font-bold tracking-tight transition-all relative ${
            activeTab === 'bookings'
              ? 'text-slate-900 font-black'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="tab-admin-bookings"
        >
          <span>QUẢN LÝ ĐẶT SÂN</span>
          {stats.pendingCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[9px]">
              {stats.pendingCount}
            </span>
          )}
          {activeTab === 'bookings' && (
            <motion.div layoutId="admTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('courts')}
          className={`pb-4 text-xs sm:text-sm font-bold tracking-tight transition-all relative ${
            activeTab === 'courts'
              ? 'text-slate-900 font-black'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="tab-admin-courts"
        >
          <span>QUẢN LÝ SÂN ({courts.length})</span>
          {activeTab === 'courts' && (
            <motion.div layoutId="admTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-4 text-xs sm:text-sm font-bold tracking-tight transition-all relative ${
            activeTab === 'stats'
              ? 'text-slate-900 font-black'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="tab-admin-stats"
        >
          <span>BÁO CÁO THU NHẬP</span>
          {activeTab === 'stats' && (
            <motion.div layoutId="admTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-4 text-xs sm:text-sm font-bold tracking-tight transition-all relative ${
            activeTab === 'settings'
              ? 'text-slate-900 font-black'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="tab-admin-settings"
        >
          <span>CẤU HÌNH THANH TOÁN QR</span>
          {activeTab === 'settings' && (
            <motion.div layoutId="admTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>
      </div>

      {/* Tabs View Port */}
      <div className="min-h-[400px]">
        
        {/* TAB 1: Booking Management Desk queue */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            
            {/* Horizontal Filter panel for bookings */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lọc trạng thái</label>
                <select
                  value={bookingFilterStatus}
                  onChange={(e) => setBookingFilterStatus(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-lime-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã duyệt (Thành công)</option>
                  <option value="canceled">Đã hủy bỏ</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lọc theo Sân</label>
                <select
                  value={bookingFilterCourt}
                  onChange={(e) => setBookingFilterCourt(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-lime-500"
                >
                  <option value="all">Tất cả sân bóng</option>
                  {courts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại bỏ & Lọc ngày chơi</label>
                <input
                  type="date"
                  value={bookingFilterDate}
                  onChange={(e) => setBookingFilterDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-[11px] focus:ring-1 focus:ring-lime-500"
                />
              </div>

            </div>

            {/* Bookings Queue Grid render */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl space-y-3">
                <p className="text-slate-400 font-medium text-sm">Không thấy lịch đặt sân nào khớp với tiêu chuẩn lọc!</p>
                <button
                  onClick={() => {
                    setBookingFilterStatus('all');
                    setBookingFilterCourt('all');
                    setBookingFilterDate('');
                  }}
                  className="px-4 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer"
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="p-4 uppercase tracking-wider text-[11px]">Khách hàng</th>
                        <th className="p-4 uppercase tracking-wider text-[11px]">Sân & Thời gian</th>
                        <th className="p-4 uppercase tracking-wider text-[11px]">Thanh toán</th>
                        <th className="p-4 uppercase tracking-wider text-[11px]">Ghi chú / Yêu cầu</th>
                        <th className="p-4 uppercase tracking-wider text-[11px] text-right">Trạng thái / Tương tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Client Detail */}
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900">{booking.customerName}</div>
                            <div className="text-xs text-slate-500">📞 {booking.customerPhone}</div>
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">Đăng ký ngày: {new Date(booking.createdAt).toLocaleDateString()}</div>
                          </td>

                          {/* Court & Play Date slot range */}
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{booking.courtName}</div>
                            <div className="text-xs font-semibold text-slate-900 mt-0.5 flex items-center space-x-1">
                              <span className="bg-slate-100 border border-slate-250 font-extrabold text-slate-900 px-1.5 py-0.5 rounded">
                                {ConvertVietnamDate(booking.date)}
                              </span>
                              <span className="bg-lime-100 font-black text-slate-900 px-1.5 py-0.5 rounded">
                                {booking.timeSlot}
                              </span>
                            </div>
                          </td>

                          {/* Pricing detailed & method details */}
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900">{booking.totalPrice.toLocaleString('vi-VN')} VNĐ</div>
                            <span className="inline-block mt-1 text-[10px] bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                              {booking.paymentMethod === 'bank_transfer' ? '🏦 CK Banking' : '💵 Trực tiếp sân'}
                            </span>
                          </td>

                          {/* Extra info notes entered */}
                          <td className="p-4 max-w-xs">
                            <span className="text-slate-600 italic leading-relaxed text-xs">
                              {booking.notes ? `"${booking.notes}"` : <span className="text-slate-300 font-normal">Không ghi chú</span>}
                            </span>
                          </td>

                          {/* Status and interactive control operations */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {booking.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => onConfirmBooking(booking.id)}
                                    className="p-1 px-2.5 bg-slate-900 hover:bg-lime-400 hover:text-slate-900 text-white rounded-lg flex items-center space-x-1 font-bold text-xs shadow-sm transition-all cursor-pointer"
                                    title="Duyệt đơn"
                                    id={`btn-approve-${booking.id}`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Duyệt</span>
                                  </button>
                                  <button
                                    onClick={() => onRejectBooking(booking.id)}
                                    className="p-1 px-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg flex items-center space-x-1 font-bold text-xs shadow-sm transition-all cursor-pointer"
                                    title="Từ chối/Hủy"
                                    id={`btn-deny-${booking.id}`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Hủy</span>
                                  </button>
                                </>
                              ) : (
                                <div className="flex items-center space-x-1.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    booking.status === 'confirmed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {booking.status === 'confirmed' ? '✓ Đã duyệt' : '✕ Đã hủy'}
                                  </span>
                                  {booking.status === 'confirmed' && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Hủy giao dịch lịch này?')) {
                                          onRejectBooking(booking.id);
                                        }
                                      }}
                                      className="p-1 text-rose-500 hover:text-white hover:bg-rose-500 rounded transition-all cursor-pointer"
                                      title="Hủy đơn này"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Operating Guidelines panel */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start space-x-3 text-xs text-slate-600">
              <Info className="w-4.5 h-4.5 shrink-0 text-slate-400 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">Quy trình vận hành hợp lý:</p>
                <p className="mt-0.5 leading-relaxed">
                  Khi khách hàng chọn đặt sân qua chuyển khoản Banking, hãy kiểm tra tài khoản nhận trước khi bấm <b>"Duyệt"</b>. Đơn sau khi duyệt thành công sẽ được kích hoạt chuyển khoản thực nhận và ghi vào báo cáo doanh thu tài chính.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Court Director configuration */}
        {activeTab === 'courts' && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Danh sách sân quản trị</h3>
                <p className="text-xs text-slate-500">Cập nhật giá cả, trạng thái hoạt động hoặc thiết lập sân mới</p>
              </div>
              
              <button
                onClick={() => setShowAddCourtModal(true)}
                className="py-2.5 px-4 bg-slate-900 text-white hover:bg-lime-400 hover:text-slate-900 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
                id="btn-trigger-add-court"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Thêm sân mới</span>
              </button>
            </div>

            {/* Courts configuration Cards list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court) => (
                <div 
                  key={court.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className="p-4 space-y-3">
                    <div className="relative h-32 rounded-xl overflow-hidden bg-slate-100">
                      <img 
                        src={court.image} 
                        alt={court.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-white uppercase tracking-wider ${
                          court.status === 'active'
                            ? 'bg-emerald-600'
                            : 'bg-amber-600'
                        }`}>
                          {court.status === 'active' ? 'Đang mở' : 'Đang sửa/đóng'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-base">{court.name}</h4>
                      <p className="text-xs text-slate-500 truncate flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{court.location}</span>
                      </p>
                    </div>

                    {/* Quick Specs info */}
                    <div className="text-[11px] grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-slate-600 border border-slate-100">
                      <div>
                        <span className="font-bold text-slate-400 block uppercase tracking-wide text-[9px]">Giá ngày (Sáng-Chiều)</span>
                        <span className="font-bold text-slate-800">{court.priceDaytime.toLocaleString()}đ / h</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-400 block uppercase tracking-wide text-[9px]">Giá tối (Chiều-Tối)</span>
                        <span className="font-bold text-slate-800">{court.priceEvening.toLocaleString()}đ / h</span>
                      </div>
                      <div className="col-span-2 border-t border-slate-200/50 pt-2 flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-bold text-slate-400 block uppercase tracking-wide text-[8px]">Đặc điểm</span>
                          <span className="font-semibold text-slate-700">
                            {[court.type === 'indoor' ? 'Trong nhà' : 'Ngoài trời', court.hasRoof ? 'Mái che' : null, court.hasLights ? 'Đèn LED' : null].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-400 block uppercase tracking-wide text-[8px]">Số lượng sân</span>
                          <span className="font-black text-slate-800 text-xs">{court.courtCount || 1} sân</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons and status toggle */}
                  <div className="border-t border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-400">Trạng thái:</span>
                      <select
                        value={court.status}
                        onChange={(e) => onUpdateCourtStatus(court.id, e.target.value as any)}
                        className="bg-slate-100 font-bold text-xs p-1 rounded-md border-none focus:ring-1 focus:ring-lime-500 cursor-pointer"
                        id={`select-status-${court.id}`}
                      >
                        <option value="active">✓ Mở sân</option>
                        <option value="maintenance">🛠 Bảo trì</option>
                        <option value="inactive">✕ Tạm đóng</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-1 justify-end">
                      <button
                        onClick={() => handleStartEditCourt(court)}
                        className="p-1 px-2.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors border border-slate-200/40"
                        title="Chỉnh sửa thông số"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('Xóa vĩnh viễn sân này và các dữ liệu liên đới không?')) {
                            onDeleteCourt(court.id);
                          }
                        }}
                        className="p-1 px-2.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors border border-rose-100/40"
                        title="Xóa sân"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* TAB 3: Advanced Income breakdown statistics */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
              
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2 animate-fade-in">
                  <TrendingUp className="w-5 h-5 text-lime-500" />
                  <span>Phân tích Doanh Thu theo Sân Pickleball</span>
                </h3>
                <p className="text-xs text-slate-400">Thống kê dữ liệu dòng tiền chỉ tính trên các đơn đặt hàng Đã Duyệt</p>
              </div>

              {/* Dynamic graph list representation */}
              <div className="space-y-4">
                {courtRevenueData.map((data) => {
                  const maxRevenue = Math.max(...courtRevenueData.map(d => d.revenue), 1);
                  const pct = Math.round((data.revenue / maxRevenue) * 100);
                  
                  return (
                    <div key={data.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="font-extrabold text-slate-800">{data.name}</span>
                        <div className="space-x-1.5">
                          <span className="text-slate-400 font-medium">({data.count} lượt đặt)</span>
                          <span className="font-extrabold text-lime-600">{data.revenue.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
                        <div 
                          className="bg-slate-900 h-full rounded-full transition-all duration-1000" 
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Breakdown detailed cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-150">
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hóa đơn trung bình (AOV)</p>
                  <p className="text-xl font-black text-slate-900">
                    {Math.round((stats.totalRev / (bookings.filter(b => b.status === 'confirmed').length || 1))).toLocaleString('vi-VN')}đ / lượt
                  </p>
                  <p className="text-[10px] text-slate-500 font-sans">Doanh thu thu về trên một đơn đặt giữ chỗ thành công</p>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tổng Đơn Đặt Trạng Thế Chờ</p>
                  <p className="text-xl font-black text-amber-600">
                    {stats.pendingCount} hóa đơn
                  </p>
                  <p className="text-[10px] text-slate-500 font-sans">Các giao dịch chưa chuyển khoản hoặc chưa được xác nhận giữ sân</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: Bank QR payment configurations & Administrator Credentials */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <form onSubmit={handleSaveBankConfig} className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-lime-500" />
                    <span>Cấu hình Ngân hàng & Mã thanh toán QR</span>
                  </h3>
                  <p className="text-xs text-slate-400">Thiết lập tài khoản ngân hàng của bạn. Thông tin này sẽ lập tức hiển thị kèm mã QR chuyển khoản khi người chơi tiến hành đặt sân.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                  {/* Form fields */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Tên ngân hàng *</label>
                        <input
                          type="text"
                          required
                          placeholder="ví dụ: Techcombank, MB, VCB..."
                          value={localBankName}
                          onChange={(e) => {
                            setLocalBankName(e.target.value);
                            setIsDirty(true);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:border-slate-400 outline-none transition-all tracking-wide"
                        />
                        <p className="text-[10px] text-slate-400">Viết liền, không dấu nếu dùng VietQR tự động (ví dụ: TCB, MB, VCB...)</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Số tài khoản ngân hàng *</label>
                        <input
                          type="text"
                          required
                          placeholder="Nhập số tài khoản..."
                          value={localAccountNumber}
                          onChange={(e) => {
                            setLocalAccountNumber(e.target.value.replace(/\s+/g, ''));
                            setIsDirty(true);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-mono tracking-wider font-extrabold focus:border-slate-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Tên chủ tài khoản *</label>
                      <input
                        type="text"
                        required
                        placeholder="ví dụ: NGUYEN VAN A (VIẾT HOA KHÔNG DẤU)"
                        value={localAccountOwner}
                        onChange={(e) => {
                          setLocalAccountOwner(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold uppercase tracking-wide focus:border-slate-400 outline-none transition-all"
                      />
                      <p className="text-[10px] text-slate-400">Nên viết IN HOA không dấu tương tự như trên thẻ ATM để bảo mật thanh toán.</p>
                    </div>

                    {/* Drag and Drop Custom File Upload for QR Image */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
                        Tải lên hình ảnh QR Tài khoản của bạn (Kéo thả hoặc bấm chọn)
                      </label>
                      <div
                        onDragOver={handleQrDragOver}
                        onDragLeave={handleQrDragLeave}
                        onDrop={handleQrDrop}
                        onClick={() => document.getElementById('qr-file-picker')?.click()}
                        className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                          isDragging 
                            ? 'border-lime-500 bg-lime-50/50' 
                            : 'border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/40'
                        }`}
                      >
                        <input
                          type="file"
                          id="qr-file-picker"
                          accept="image/*"
                          className="hidden"
                          onChange={handleQrFileChange}
                        />
                        
                        {localQrCodeUrl && (localQrCodeUrl.startsWith('data:') || localQrCodeUrl.includes('base64')) ? (
                          <div className="flex flex-col items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                            <div className="w-24 h-24 border border-slate-200 rounded-2xl overflow-hidden bg-white p-1.5 shadow-inner">
                              <img src={localQrCodeUrl} className="w-full h-full object-contain" alt="QR đã tải lên" />
                            </div>
                            <span className="text-[11px] font-black text-lime-700 flex items-center gap-1 bg-lime-100/80 px-2.5 py-1 rounded-full">
                              <Check className="w-3 h-3 text-lime-600 stroke-[3]" />
                              <span>Đã nhận hình ảnh mã QR tải lên của bạn</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLocalQrCodeUrl('');
                                setIsDirty(true);
                              }}
                              className="text-[10px] text-red-650 font-extrabold uppercase bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-full transition-all border border-red-100 active:scale-95 animate-fade-in"
                            >
                              Xóa & Sử dụng mã VietQR tự sinh
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 bg-white shadow-sm border border-slate-200 rounded-2xl text-slate-400 group-hover:text-slate-600">
                              <Upload className="w-6 h-6 text-lime-600 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-700">
                                Kéo thả hình ảnh mã QR vào đây, hoặc <span className="text-lime-600 hover:text-lime-700 underline">bấm chọn tệp từ máy của bạn</span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
                                Hệ thống sẽ mã hóa và lưu trữ trực tiếp ảnh QR của quý khách, tự động hiển thị khi người dùng chọn thanh toán chuyển khoản cực kỳ chuyên nghiệp.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Đường dẫn mã QR thủ công (Tùy chọn phụ)</label>
                      <input
                        type="url"
                        placeholder="https://example.com/my-fixed-qr.png"
                        value={localQrCodeUrl.startsWith('data:') ? '' : localQrCodeUrl}
                        onChange={(e) => {
                          setLocalQrCodeUrl(e.target.value.trim());
                          setIsDirty(true);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-slate-400 outline-none transition-all"
                      />
                      <p className="text-[10px] text-slate-400">Nếu đã tự tải ảnh lên ở mục trên thì không cần điền liên kết tĩnh này.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={saveStatus === 'saving'}
                        className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 ${
                          saveStatus === 'saving'
                            ? 'bg-slate-400 text-white cursor-not-allowed'
                            : saveStatus === 'saved'
                            ? 'bg-lime-600 text-white animate-pulse'
                            : saveStatus === 'error'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {saveStatus === 'saving' && (
                          <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        )}
                        <span>
                          {saveStatus === 'saving'
                            ? 'Đang lưu cấu hình...'
                            : saveStatus === 'saved'
                            ? 'Đã lưu cấu hình thành công!'
                            : saveStatus === 'error'
                            ? 'Gặp lỗi khi lưu!'
                            : 'Lưu cấu hình hoạt động'}
                        </span>
                      </button>

                      {saveStatus === 'saved' && (
                        <span className="text-xs text-lime-600 font-extrabold animate-pulse">
                          ✓ Thông tin đã lưu xuống bộ lưu trữ của hệ thống máy chủ.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real-time Preview Widget */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center space-y-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-200/60 px-2.5 py-1 rounded-full">
                      Xem trước bản xem của người đặt sân
                    </span>

                    <div className="w-40 h-40 bg-white border border-slate-200 rounded-2xl p-2 flex items-center justify-center overflow-hidden shadow-md relative group">
                      <img
                        src={localQrCodeUrl || `https://img.vietqr.io/image/${localBankName || 'bank'}-${localAccountNumber || '0000'}-compact.jpg?accountName=${encodeURIComponent(localAccountOwner || 'PICKLEPRO')}`}
                        alt="Xem trước mã QR"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-1.5 w-full text-left bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm text-xs">
                      <div className="flex justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-slate-400 font-bold">NGÂN HÀNG:</span>
                        <span className="font-black text-slate-800 uppercase">{localBankName || '(Chưa nhập)'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 py-1.5">
                        <span className="text-slate-400 font-bold">STK:</span>
                        <span className="font-mono font-extrabold text-slate-900">{localAccountNumber || '(Chưa nhập)'}</span>
                      </div>
                      <div className="flex justify-between pt-1.5">
                        <span className="text-slate-400 font-bold">CHỦ TÀI KHOẢN:</span>
                        <span className="font-bold text-slate-800 uppercase">{localAccountOwner || '(Chưa nhập)'}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 max-w-xs leading-normal">
                      {localQrCodeUrl ? 'Hệ thống đang hiển thị mã QR tự tải lên của bạn.' : 'Mã QR trên được liên kết trực tiếp bằng công nghệ VietQR để người dùng chỉ cần mở ứng dụng ngân hàng và quét là hoàn thành thanh toán.'}
                    </p>
                  </div>
                </div>
              </div>
            </form>

            {/* TAB 4B: Change Password configuration */}
            <form onSubmit={handleSavePassword} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-lime-500" />
                  <span>Đổi Mật Khẩu Chủ Sân</span>
                </h3>
                <p className="text-xs text-slate-400">Thay đổi mật khẩu đăng nhập vào trang quản trị (chủ sân). Mật khẩu mới được bảo mật và lưu trữ lâu dài trên máy chủ.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập mật khẩu mới..."
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:border-slate-400 outline-none transition-all tracking-wide"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    placeholder="Nhập lại mật khẩu mới..."
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold focus:border-slate-400 outline-none transition-all tracking-wide"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={pwdSaveStatus === 'saving'}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 ${
                    pwdSaveStatus === 'saving'
                      ? 'bg-slate-400 text-white cursor-not-allowed'
                      : pwdSaveStatus === 'saved'
                      ? 'bg-lime-600 text-white animate-pulse'
                      : pwdSaveStatus === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {pwdSaveStatus === 'saving' && (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  )}
                  <span>
                    {pwdSaveStatus === 'saving'
                      ? 'Đang đổi mật khẩu...'
                      : pwdSaveStatus === 'saved'
                      ? 'Đã cập nhật mật khẩu!'
                      : pwdSaveStatus === 'error'
                      ? 'Lỗi cập nhật!'
                      : 'Cập nhật mật khẩu'}
                  </span>
                </button>

                {pwdMsg && (
                  <span className={`text-xs font-extrabold ${pwdSaveStatus === 'error' ? 'text-red-650' : 'text-lime-700 animate-pulse'}`}>
                    {pwdMsg}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

      </div>

      {/* MODAL 3: Admin Add New Court Modal form */}
      <AnimatePresence>
        {showAddCourtModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCourtModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body form */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowAddCourtModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 p-1.5 rounded-full z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 border-b border-zinc-150 pb-3 mb-5">
                <PlusCircle className="text-lime-500 w-5 h-5" />
                <h3 className="text-lg font-extrabold text-zinc-900">Thêm Sân Pickleball mới</h3>
              </div>

              <form onSubmit={handleCreateCourt} className="space-y-4">
                
                {/* Court Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Tên sân bóng *</label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Sân Pickleball Sala Quận 2"
                    value={newCourtName}
                    onChange={(e) => setNewCourtName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-lime-500 outline-none"
                  />
                </div>

                {/* Court Location */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: 10 Mai Chí Thọ, Thủ Thiêm, TP. Thủ Đức"
                    value={newCourtLocation}
                    onChange={(e) => setNewCourtLocation(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-lime-500 outline-none"
                  />
                </div>

                {/* Price specs daytime & nighttime */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Giá ban ngàyđ/h *</label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={10000}
                      value={newCourtPriceDay}
                      onChange={(e) => setNewCourtPriceDay(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-lime-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Giá giờ tốiđ/h *</label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={10000}
                      value={newCourtPriceEve}
                      onChange={(e) => setNewCourtPriceEve(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-lime-500 outline-none"
                    />
                  </div>
                </div>

                {/* Types specifications */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-1">
                  
                  {/* Category Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide block">Nơi chơi</label>
                    <select
                      value={newCourtType}
                      onChange={(e) => setNewCourtType(e.target.value as any)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-lime-500 outline-none"
                    >
                      <option value="indoor">Trong nhà</option>
                      <option value="outdoor">Ngoài trời</option>
                    </select>
                  </div>

                  {/* Court Count */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide block">Số lượng sân *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newCourtCount}
                      onChange={(e) => setNewCourtCount(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-bold focus:ring-1 focus:ring-lime-500 outline-none"
                    />
                  </div>

                  {/* Amenities checklist checkboxes */}
                  <div className="flex flex-col justify-center space-y-1.5 pl-2">
                    <label className="flex items-center space-x-2 text-xs font-medium text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCourtRoof}
                        onChange={(e) => setNewCourtRoof(e.target.checked)}
                        className="rounded border-zinc-300 text-lime-500 accent-lime-500 h-4 w-4"
                      />
                      <span>Có mái che</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-medium text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCourtLights}
                        onChange={(e) => setNewCourtLights(e.target.checked)}
                        className="rounded border-zinc-300 text-lime-500 accent-lime-500 h-4 w-4"
                      />
                      <span>Có đèn LED đêm</span>
                    </label>
                  </div>

                </div>

                {/* Picture selector URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Đường dẫn ảnh minh họa sân (URL)</label>
                  <input
                    type="url"
                    placeholder="Chọn ảnh Unsplash hoặc bỏ trống mặc định"
                    value={newCourtImg}
                    onChange={(e) => setNewCourtImg(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-lime-500 outline-none"
                  />
                </div>

                {/* Court Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide font-sans">Chi tiết / Mô tả tóm tắt sân</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả chất lượng sàn, chỗ ngồi cho khách, dịch vụ đi kèm..."
                    value={newCourtDesc}
                    onChange={(e) => setNewCourtDesc(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-lime-500 outline-none resize-none"
                  />
                </div>

                {/* Confirm additions */}
                <div className="flex space-x-3 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowAddCourtModal(false)}
                    className="flex-1 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs rounded-xl"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs rounded-xl shadow-md"
                    id="btn-confirm-add-court"
                  >
                    Lưu sân mới
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Admin Edit Existing Court Modal info */}
      <AnimatePresence>
        {showEditCourtModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditCourtModal(false);
                setEditingCourt(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body form */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setShowEditCourtModal(false);
                  setEditingCourt(null);
                }}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 p-1.5 rounded-full z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-2 border-b border-zinc-150 pb-3 mb-5">
                <Sliders className="text-lime-500 w-5 h-5" />
                <h3 className="text-lg font-extrabold text-zinc-900">Chỉnh sửa Sân Pickleball</h3>
              </div>

              <form onSubmit={handleSaveEditCourt} className="space-y-4">
                
                {/* Court Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Tên sân bóng *</label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: Sân Pickleball Sala Quận 2"
                    value={editCourtName}
                    onChange={(e) => setEditCourtName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-lime-500 outline-none font-bold"
                  />
                </div>

                {/* Court Location */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    required
                    placeholder="Địa chỉ sân..."
                    value={editCourtLocation}
                    onChange={(e) => setEditCourtLocation(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-lime-500 outline-none"
                  />
                </div>

                {/* Price specs daytime & nighttime */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Giá ban ngày đ/h *</label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={10000}
                      value={editCourtPriceDay}
                      onChange={(e) => setEditCourtPriceDay(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-lime-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Giá giờ tối đ/h *</label>
                    <input
                      type="number"
                      required
                      min={10000}
                      step={10000}
                      value={editCourtPriceEve}
                      onChange={(e) => setEditCourtPriceEve(Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-sm focus:ring-1 focus:ring-lime-500 outline-none font-bold"
                    />
                  </div>
                </div>

                {/* Types specifications */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-1">
                  
                  {/* Category Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide block">Nơi chơi</label>
                    <select
                      value={editCourtType}
                      onChange={(e) => setEditCourtType(e.target.value as any)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-lime-500 outline-none"
                    >
                      <option value="indoor">Trong nhà</option>
                      <option value="outdoor">Ngoài trời</option>
                    </select>
                  </div>

                  {/* Court Count */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide block">Số lượng sân *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editCourtCount}
                      onChange={(e) => setEditCourtCount(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs font-bold focus:ring-1 focus:ring-lime-500 outline-none font-bold"
                    />
                  </div>

                  {/* Amenities checklist checkboxes */}
                  <div className="flex flex-col justify-center space-y-1.5 pl-2">
                    <label className="flex items-center space-x-2 text-xs font-medium text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCourtRoof}
                        onChange={(e) => setEditCourtRoof(e.target.checked)}
                        className="rounded border-zinc-300 text-lime-500 accent-lime-500 h-4 w-4"
                      />
                      <span>Có mái che</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs font-medium text-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editCourtLights}
                        onChange={(e) => setEditCourtLights(e.target.checked)}
                        className="rounded border-zinc-300 text-lime-500 accent-lime-500 h-4 w-4"
                      />
                      <span>Có đèn LED đêm</span>
                    </label>
                  </div>

                </div>

                {/* Picture selector URL */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Đường dẫn ảnh minh họa sân (URL)</label>
                  <input
                    type="url"
                    placeholder="URL ảnh..."
                    value={editCourtImg}
                    onChange={(e) => setEditCourtImg(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-lime-500 outline-none"
                  />
                </div>

                {/* Court Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide font-sans">Chi tiết / Mô tả tóm tắt sân</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả..."
                    value={editCourtDesc}
                    onChange={(e) => setEditCourtDesc(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-lime-500 outline-none resize-none"
                  />
                </div>

                {/* Confirm additions */}
                <div className="flex space-x-3 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditCourtModal(false);
                      setEditingCourt(null);
                    }}
                    className="flex-1 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Simple Helper function to format date strings into Vietnamese friendly format
function ConvertVietnamDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

import { Court, Booking, TimeSlotConfig } from './types';

export const TIME_SLOTS: TimeSlotConfig[] = [
  { start: '05:00', end: '06:00', isEvening: false },
  { start: '06:00', end: '07:00', isEvening: false },
  { start: '07:00', end: '08:00', isEvening: false },
  { start: '08:00', end: '09:00', isEvening: false },
  { start: '09:00', end: '10:00', isEvening: false },
  { start: '10:00', end: '11:00', isEvening: false },
  { start: '11:00', end: '12:00', isEvening: false },
  { start: '12:00', end: '13:00', isEvening: false },
  { start: '13:00', end: '14:00', isEvening: false },
  { start: '14:00', end: '15:00', isEvening: false },
  { start: '15:00', end: '16:00', isEvening: false },
  { start: '16:00', end: '17:00', isEvening: true }, // From 4 PM, prices increase
  { start: '17:00', end: '18:00', isEvening: true },
  { start: '18:00', end: '19:00', isEvening: true },
  { start: '19:00', end: '20:00', isEvening: true },
  { start: '20:00', end: '21:00', isEvening: true },
  { start: '21:00', end: '22:00', isEvening: true },
];

export const INITIAL_COURTS: Court[] = [
  {
    id: 'court-1',
    name: 'Sân Pickleball Số 1 (Trong nhà)',
    location: '140 - Nguyễn Văn Cừ - Đồng Hới - Quảng Trị',
    type: 'indoor',
    hasRoof: true,
    hasLights: true,
    priceDaytime: 150000,
    priceEvening: 220000,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800',
    description: 'Sân số 1 trong nhà khánh thành mới tinh, lót sàn đệm giảm chấn cao cấp giúp bảo vệ khớp chân, mái che kín kẽ chắn mưa râm mát cả ngày.',
    status: 'active',
    courtCount: 1,
  },
  {
    id: 'court-2',
    name: 'Sân Pickleball Số 2 (Ngoài trời)',
    location: '140 - Nguyễn Văn Cừ - Đồng Hới - Quảng Trị',
    type: 'outdoor',
    hasRoof: false,
    hasLights: true,
    priceDaytime: 120000,
    priceEvening: 180000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1613918431208-6752fe4ef75d?auto=format&fit=crop&q=80&w=800',
    description: 'Sân số 2 ngoài trời cực thoáng mát, trang bị hệ thống dàn đèn LED rực rỡ chơi ban sáng ấm áp ban tối mát mẻ cực thích thú.',
    status: 'active',
    courtCount: 1,
  }
];

// Generate some realistic recent bookings for today and tomorrow to give the system real data
const getTodayDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b-1',
    courtId: 'court-1',
    courtName: 'Sân Pickleball Số 1 (Trong nhà)',
    customerName: 'Nguyễn Văn Minh',
    customerPhone: '0901234567',
    date: getTodayDateString(0),
    timeSlot: '06:00 - 07:00',
    totalPrice: 150000,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    paymentMethod: 'bank_transfer',
    notes: 'Thuê thêm 2 vợt chơi',
  },
  {
    id: 'b-2',
    courtId: 'court-1',
    courtName: 'Sân Pickleball Số 1 (Trong nhà)',
    customerName: 'Trần Thị Thu Trang',
    customerPhone: '0912987654',
    date: getTodayDateString(0),
    timeSlot: '17:00 - 18:00',
    totalPrice: 220000,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    paymentMethod: 'bank_transfer',
  },
  {
    id: 'b-3',
    courtId: 'court-2',
    courtName: 'Sân Pickleball Số 2 (Ngoài trời)',
    customerName: 'Lê Hoàng Hải',
    customerPhone: '0988776655',
    date: getTodayDateString(0),
    timeSlot: '18:00 - 19:00',
    totalPrice: 180000,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    paymentMethod: 'at_court',
    notes: 'Cần mượn giỏ bóng tập',
  },
  {
    id: 'b-4',
    courtId: 'court-1',
    courtName: 'Sân Pickleball Số 1 (Trong nhà)',
    customerName: 'Phạm Đức Anh',
    customerPhone: '0933344556',
    date: getTodayDateString(1), // Tomorrow
    timeSlot: '08:00 - 09:00',
    totalPrice: 150000,
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    paymentMethod: 'bank_transfer',
  },
  {
    id: 'b-5',
    courtId: 'court-2',
    courtName: 'Sân Pickleball Số 2 (Ngoài trời)',
    customerName: 'Vũ Thị Hồng',
    customerPhone: '0905544332',
    date: getTodayDateString(0),
    timeSlot: '19:00 - 20:00',
    totalPrice: 180000,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    paymentMethod: 'bank_transfer',
  }
];

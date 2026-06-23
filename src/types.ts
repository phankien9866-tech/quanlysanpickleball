export interface Court {
  id: string;
  name: string;
  location: string;
  type: 'indoor' | 'outdoor';
  hasRoof: boolean;
  hasLights: boolean;
  priceDaytime: number; // Legacy or fallback Daytime price
  priceEvening: number; // Legacy or fallback Evening price
  
  // New specific pricing requirements
  priceNoLights?: number;             // Default 60,000 VND/hour
  priceLightsMonthlyDaytime?: number; // 5h - 17h with lights: Default 80,000 VND/hour
  priceLightsMonthlyEvening?: number; // 17h - 22h with lights: Default 100,000 VND/hour
  priceLightsCasual?: number;         // Casual with lights: Default 120,000 VND/hour
  priceRacketRental?: number;         // Default 30,000 VND
  priceBallRental?: number;           // Default 30,000 VND

  rating: number;
  image: string;
  description: string;
  status: 'active' | 'maintenance' | 'inactive';
  courtCount: number;
}

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  customerName: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "06:00 - 07:00", etc.
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'canceled';
  createdAt: string;
  notes?: string;
  paymentMethod: 'at_court' | 'bank_transfer';

  // New specific booking selections
  useLights?: boolean;                // "Có" / "Không" sử dụng đèn
  rentalType?: 'casual' | 'monthly';  // "Thuê lẻ" (casual) / "Thuê cố định theo tháng" (monthly)
  rentRackets?: boolean;              // "Có" / "Không" thuê vợt
  rentBalls?: boolean;                // "Có" / "Không" thuê rổ bóng tập
  bookingGroupId?: string;            // ID nhóm đặt sân cố định (để kết nối các buổi của tháng)
  monthsCount?: number;               // Số tháng đã chọn thuê
}

export interface TimeSlotConfig {
  start: string; // "06:00"
  end: string;   // "07:00"
  isEvening: boolean;
}

export interface BankConfig {
  bankName: string;
  accountNumber: string;
  accountOwner: string;
  qrCodeUrl?: string;
}


export interface Court {
  id: string;
  name: string;
  location: string;
  type: 'indoor' | 'outdoor';
  hasRoof: boolean;
  hasLights: boolean;
  priceDaytime: number; // Price per hour (e.g., 5 AM - 4 PM)
  priceEvening: number; // Price per hour (e.g., 4 PM - 10 PM)
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


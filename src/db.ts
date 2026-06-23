import fs from "fs";
import path from "path";
import { Court, Booking, BankConfig } from "./types";

// Absolute paths to local database files in the /src directory
const COURTS_FILE = path.join(process.cwd(), "src", "courts.json");
const BOOKINGS_FILE = path.join(process.cwd(), "src", "bookings.json");
const BANK_FILE = path.join(process.cwd(), "src", "bank-config.json");

// Helper to safely write JSON
function writeJsonFile(filePath: string, data: any) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Error writing local database file ${filePath}:`, err);
  }
}

// Helper to safely read JSON
function readJsonFile<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading local database file ${filePath}:`, err);
  }
  return null;
}

export async function fetchCourtsFromDb(defaultCourts: Court[]): Promise<Court[]> {
  try {
    const list = readJsonFile<Court[]>(COURTS_FILE);
    if (list && list.length > 0) {
      return list.sort((a, b) => a.id.localeCompare(b.id));
    }
    // Seed and write default
    writeJsonFile(COURTS_FILE, defaultCourts);
    return defaultCourts;
  } catch (err) {
    console.error("Local DB fetchCourts failed, using default:", err);
    return defaultCourts;
  }
}

export async function saveCourtToDb(court: Court): Promise<void> {
  try {
    const list = readJsonFile<Court[]>(COURTS_FILE) || [];
    const index = list.findIndex(c => c.id === court.id);
    if (index >= 0) {
      list[index] = court;
    } else {
      list.push(court);
    }
    writeJsonFile(COURTS_FILE, list);
  } catch (err) {
    console.error("Local DB saveCourt failed:", err);
  }
}

export async function deleteCourtFromDb(id: string): Promise<void> {
  try {
    let list = readJsonFile<Court[]>(COURTS_FILE) || [];
    list = list.filter(c => c.id !== id);
    writeJsonFile(COURTS_FILE, list);
  } catch (err) {
    console.error("Local DB deleteCourt failed:", err);
  }
}

export async function fetchBookingsFromDb(defaultBookings: Booking[]): Promise<Booking[]> {
  try {
    const list = readJsonFile<Booking[]>(BOOKINGS_FILE);
    if (list && list.length > 0) {
      return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }
    // Seed and write default
    writeJsonFile(BOOKINGS_FILE, defaultBookings);
    return defaultBookings;
  } catch (err) {
    console.error("Local DB fetchBookings failed, using default:", err);
    return defaultBookings;
  }
}

export async function saveBookingToDb(booking: Booking): Promise<void> {
  try {
    const list = readJsonFile<Booking[]>(BOOKINGS_FILE) || [];
    const index = list.findIndex(b => b.id === booking.id);
    if (index >= 0) {
      list[index] = booking;
    } else {
      list.push(booking);
    }
    writeJsonFile(BOOKINGS_FILE, list);
  } catch (err) {
    console.error("Local DB saveBooking failed:", err);
  }
}

export async function fetchBankConfigFromDb(defaultBank: BankConfig): Promise<BankConfig> {
  try {
    const config = readJsonFile<BankConfig>(BANK_FILE);
    if (config) {
      return config;
    }
    // Seed default
    writeJsonFile(BANK_FILE, defaultBank);
    return defaultBank;
  } catch (err) {
    console.error("Local DB fetchBankConfig failed, using default:", err);
    return defaultBank;
  }
}

export async function saveBankConfigToDb(bankConfig: BankConfig): Promise<void> {
  try {
    writeJsonFile(BANK_FILE, bankConfig);
  } catch (err) {
    console.error("Local DB saveBankConfig failed:", err);
  }
}

import fs from "fs";
import path from "path";
import { Court, Booking, BankConfig } from "./types";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Absolute paths to local database files in the /src directory
const COURTS_FILE = path.join(process.cwd(), "src", "courts.json");
const BOOKINGS_FILE = path.join(process.cwd(), "src", "bookings.json");
const BANK_FILE = path.join(process.cwd(), "src", "bank-config.json");

// Load Firebase configuration
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = null;
if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
  } catch (e) {
    console.error("Failed to read firebase config in server:", e);
  }
}

let db: any = null;
if (firebaseConfig && firebaseConfig.projectId) {
  try {
    if (getApps().length === 0) {
      initializeApp({
        projectId: firebaseConfig.projectId
      });
    }
    db = getFirestore(firebaseConfig.firestoreDatabaseId || undefined);
    console.log("Firebase Admin Firestore client initialized successfully in server/db.");
  } catch (err) {
    console.error("Failed to initialize Firebase Admin SDK:", err);
  }
}

// Helper to safely write local JSON
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

// Helper to safely read local JSON
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
  // Try cloud first
  if (db) {
    try {
      const snapshot = await db.collection("courts").get();
      const list: Court[] = [];
      snapshot.forEach((doc: any) => {
        list.push({ ...doc.data(), id: doc.id } as Court);
      });
      if (list.length > 0) {
        const sorted = list.sort((a, b) => a.id.localeCompare(b.id));
        writeJsonFile(COURTS_FILE, sorted); // Sync local cache
        return sorted;
      }
      // If empty in cloud, seed with default courts
      for (const court of defaultCourts) {
        await db.collection("courts").doc(court.id).set(court);
      }
      writeJsonFile(COURTS_FILE, defaultCourts);
      return defaultCourts;
    } catch (err) {
      console.error("Firestore fetchCourts failed, falling back to local file:", err);
    }
  }

  // Fallback to local file
  try {
    const list = readJsonFile<Court[]>(COURTS_FILE);
    if (list && list.length > 0) {
      return list.sort((a, b) => a.id.localeCompare(b.id));
    }
    writeJsonFile(COURTS_FILE, defaultCourts);
    return defaultCourts;
  } catch (err) {
    console.error("Local DB fetchCourts failed, using default:", err);
    return defaultCourts;
  }
}

export async function saveCourtToDb(court: Court): Promise<void> {
  // Save to cloud
  if (db) {
    try {
      await db.collection("courts").doc(court.id).set(court);
    } catch (err) {
      console.error("Firestore saveCourt failed:", err);
    }
  }

  // Save to local cache
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
  // Delete from cloud
  if (db) {
    try {
      await db.collection("courts").doc(id).delete();
    } catch (err) {
      console.error("Firestore deleteCourt failed:", err);
    }
  }

  // Delete from local cache
  try {
    let list = readJsonFile<Court[]>(COURTS_FILE) || [];
    list = list.filter(c => c.id !== id);
    writeJsonFile(COURTS_FILE, list);
  } catch (err) {
    console.error("Local DB deleteCourt failed:", err);
  }
}

export async function fetchBookingsFromDb(defaultBookings: Booking[]): Promise<Booking[]> {
  // Try cloud first
  if (db) {
    try {
      const snapshot = await db.collection("bookings").get();
      const list: Booking[] = [];
      snapshot.forEach((doc: any) => {
        list.push({ ...doc.data(), id: doc.id } as Booking);
      });
      if (list.length > 0) {
        const sorted = list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        writeJsonFile(BOOKINGS_FILE, sorted); // Sync local cache
        return sorted;
      }
      // If empty in cloud, seed with defaults
      for (const b of defaultBookings) {
        await db.collection("bookings").doc(b.id).set(b);
      }
      writeJsonFile(BOOKINGS_FILE, defaultBookings);
      return defaultBookings;
    } catch (err) {
      console.error("Firestore fetchBookings failed, falling back to local file:", err);
    }
  }

  // Fallback to local file
  try {
    const list = readJsonFile<Booking[]>(BOOKINGS_FILE);
    if (list && list.length > 0) {
      return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }
    writeJsonFile(BOOKINGS_FILE, defaultBookings);
    return defaultBookings;
  } catch (err) {
    console.error("Local DB fetchBookings failed, using default:", err);
    return defaultBookings;
  }
}

export async function saveBookingToDb(booking: Booking): Promise<void> {
  // Save to cloud
  if (db) {
    try {
      await db.collection("bookings").doc(booking.id).set(booking);
    } catch (err) {
      console.error("Firestore saveBooking failed:", err);
    }
  }

  // Save to local cache
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
  // Try cloud first
  if (db) {
    try {
      const d = await db.collection("config").doc("bank").get();
      if (d.exists) {
        const config = d.data() as BankConfig;
        writeJsonFile(BANK_FILE, config); // Sync local cache
        return config;
      }
      // Seed if empty
      await db.collection("config").doc("bank").set(defaultBank);
      writeJsonFile(BANK_FILE, defaultBank);
      return defaultBank;
    } catch (err) {
      console.error("Firestore fetchBankConfig failed, falling back to local file:", err);
    }
  }

  // Fallback to local file
  try {
    const config = readJsonFile<BankConfig>(BANK_FILE);
    if (config) {
      return config;
    }
    writeJsonFile(BANK_FILE, defaultBank);
    return defaultBank;
  } catch (err) {
    console.error("Local DB fetchBankConfig failed, using default:", err);
    return defaultBank;
  }
}

export async function saveBankConfigToDb(bankConfig: BankConfig): Promise<void> {
  // Save to cloud
  if (db) {
    try {
      await db.collection("config").doc("bank").set(bankConfig);
    } catch (err) {
      console.error("Firestore saveBankConfig failed:", err);
    }
  }

  // Save to local cache
  try {
    writeJsonFile(BANK_FILE, bankConfig);
  } catch (err) {
    console.error("Local DB saveBankConfig failed:", err);
  }
}

export async function fetchAdminPasswordFromDb(defaultPassword: string): Promise<string> {
  if (db) {
    try {
      const d = await db.collection("config").doc("admin").get();
      if (d.exists) {
        return d.data().password || defaultPassword;
      }
      await db.collection("config").doc("admin").set({ password: defaultPassword });
      return defaultPassword;
    } catch (err) {
      console.error("Firestore fetchAdminPassword failed, using default:", err);
    }
  }
  return defaultPassword;
}

export async function saveAdminPasswordToDb(password: string): Promise<void> {
  if (db) {
    try {
      await db.collection("config").doc("admin").set({ password });
    } catch (err) {
      console.error("Firestore saveAdminPassword failed:", err);
    }
  }
}

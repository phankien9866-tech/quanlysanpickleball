import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Court, Booking, BankConfig } from "./src/types";
import {
  fetchCourtsFromDb,
  saveCourtToDb,
  deleteCourtFromDb,
  fetchBookingsFromDb,
  saveBookingToDb,
  fetchBankConfigFromDb,
  saveBankConfigToDb
} from "./src/db";

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE_PATH = path.join(process.cwd(), "data-store.json");
const PASSWORD_FILE_PATH = path.join(process.cwd(), "src", "admin-password.txt");

function getAdminPassword(): string {
  try {
    if (fs.existsSync(PASSWORD_FILE_PATH)) {
      return fs.readFileSync(PASSWORD_FILE_PATH, "utf-8").trim() || "0911370429";
    }
  } catch (err) {
    console.error("Error reading admin password file:", err);
  }
  return "0911370429";
}

function saveAdminPassword(pwd: string) {
  try {
    fs.writeFileSync(PASSWORD_FILE_PATH, pwd.trim(), "utf-8");
  } catch (err) {
    console.error("Error writing admin password file:", err);
  }
}

// Helper to get today's date offset
const getTodayDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
};

// Initial default data
const DEFAULT_COURTS: Court[] = [
  {
    id: "court-1",
    name: "Sân Pickleball Số 1 (Trong nhà)",
    location: "140 - Nguyễn Văn Cừ - Đồng Hới - Quảng Trị",
    type: "indoor",
    hasRoof: true,
    hasLights: true,
    priceDaytime: 150000,
    priceEvening: 220000,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800",
    description: "Sân số 1 trong nhà khánh thành mới tinh, lót sàn đệm giảm chấn cao cấp giúp bảo vệ khớp chân, mái che kín kẽ chắn mưa râm mát cả ngày.",
    status: "active",
    courtCount: 1,
  },
  {
    id: "court-2",
    name: "Sân Pickleball Số 2 (Ngoài trời)",
    location: "140 - Nguyễn Văn Cừ - Đồng Hới - Quảng Trị",
    type: "outdoor",
    hasRoof: false,
    hasLights: true,
    priceDaytime: 120000,
    priceEvening: 180000,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1613918431208-6752fe4ef75d?auto=format&fit=crop&q=80&w=800",
    description: "Sân số 2 ngoài trời cực thoáng mát, trang bị hệ thống dàn đèn LED rực rỡ chơi ban sáng ấm áp ban tối mát mẻ cực thích thú.",
    status: "active",
    courtCount: 1,
  }
];

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: "b-1",
    courtId: "court-1",
    courtName: "Sân Pickleball Số 1 (Trong nhà)",
    customerName: "Nguyễn Văn Minh",
    customerPhone: "0901234567",
    date: getTodayDateString(0),
    timeSlot: "06:00 - 07:00",
    totalPrice: 150000,
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    paymentMethod: "bank_transfer",
    notes: "Thuê thêm 2 vợt chơi",
  },
  {
    id: "b-2",
    courtId: "court-1",
    courtName: "Sân Pickleball Số 1 (Trong nhà)",
    customerName: "Trần Thị Thu Trang",
    customerPhone: "0912987654",
    date: getTodayDateString(0),
    timeSlot: "17:00 - 18:00",
    totalPrice: 220000,
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    paymentMethod: "bank_transfer",
  },
  {
    id: "b-3",
    courtId: "court-2",
    courtName: "Sân Pickleball Số 2 (Ngoài trời)",
    customerName: "Lê Hoàng Hải",
    customerPhone: "0988776655",
    date: getTodayDateString(0),
    timeSlot: "18:00 - 19:00",
    totalPrice: 180000,
    status: "confirmed",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    paymentMethod: "at_court",
    notes: "Cần mượn giỏ bóng tập",
  }
];

const DEFAULT_BANK: BankConfig = {
  bankName: "Techcombank",
  accountNumber: "190356789999",
  accountOwner: "PICKLEPRO",
  qrCodeUrl: ""
};

// Application state structure
interface AppState {
  courts: Court[];
  bookings: Booking[];
  bankConfig: BankConfig;
}

let state: AppState = {
  courts: DEFAULT_COURTS,
  bookings: DEFAULT_BOOKINGS,
  bankConfig: DEFAULT_BANK
};

// Helper to load state from JSON file
function loadDataFromFile() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE_PATH, "utf-8"));
      state = {
        courts: parsed.courts || DEFAULT_COURTS,
        bookings: parsed.bookings || DEFAULT_BOOKINGS,
        bankConfig: parsed.bankConfig || DEFAULT_BANK
      };
      console.log("Data loaded successfully from persistence storage.");
    } else {
      saveDataToFile();
    }
  } catch (err) {
    console.error("Error reading persistence data-store file, using defaults:", err);
  }
}

// Helper to save state to file asynchronously/synchronously
function saveDataToFile() {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving data to file:", err);
  }
}

async function startServer() {
  // Load local data immediately on startup as cache fallback
  loadDataFromFile();

  // Load and upgrade to standard cloud persistent database (Firebase Firestore)
  try {
    state.courts = await fetchCourtsFromDb(state.courts);
    state.bookings = await fetchBookingsFromDb(state.bookings);
    state.bankConfig = await fetchBankConfigFromDb(state.bankConfig);
    // Write cloud data back to local storage as double-layered backup
    saveDataToFile();
    console.log("Database initialized successfully: Cloud persistence active and fully loaded.");
  } catch (err) {
    console.error("Database connection warning: falling back to high-capacity local disk persistence:", err);
  }

  const app = express();
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // API ROUTE: Get all courts
  app.get("/api/courts", (req, res) => {
    res.json(state.courts);
  });

  // API ROUTE: Save/Add a court
  app.post("/api/courts", (req, res) => {
    const newCourt: Court = req.body;
    if (!newCourt.id) {
       newCourt.id = "court-" + Date.now();
    }
    state.courts.push(newCourt);
    saveDataToFile();
    saveCourtToDb(newCourt).catch(console.error);
    res.status(201).json(newCourt);
  });

  // API ROUTE: Update a court
  app.put("/api/courts", (req, res) => {
    const updatedCourt: Court = req.body;
    state.courts = state.courts.map(c => c.id === updatedCourt.id ? updatedCourt : c);
    saveDataToFile();
    saveCourtToDb(updatedCourt).catch(console.error);
    res.json(updatedCourt);
  });

  // API ROUTE: Update court status (active/inactive/maintenance)
  app.patch("/api/courts/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    state.courts = state.courts.map(c => c.id === id ? { ...c, status } : c);
    saveDataToFile();
    const updated = state.courts.find(c => c.id === id);
    if (updated) {
      saveCourtToDb(updated).catch(console.error);
    }
    res.json({ success: true, id, status });
  });

  // API ROUTE: Delete a court
  app.delete("/api/courts/:id", (req, res) => {
    const { id } = req.params;
    state.courts = state.courts.filter(c => c.id !== id);
    // Also cancel or flag bookings on this court if needed, or leave them
    saveDataToFile();
    deleteCourtFromDb(id).catch(console.error);
    res.json({ success: true, id });
  });

  // API ROUTE: Get all bookings
  app.get("/api/bookings", (req, res) => {
    res.json(state.bookings);
  });

  // API ROUTE: Create a booking
  app.post("/api/bookings", (req, res) => {
    const newBooking: Booking = req.body;
    if (!newBooking.id) {
       newBooking.id = "b-" + Date.now();
    }
    state.bookings.push(newBooking);
    saveDataToFile();
    saveBookingToDb(newBooking).catch(console.error);
    res.status(201).json(newBooking);
  });

  // API ROUTE: Update booking status
  app.patch("/api/bookings/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    state.bookings = state.bookings.map(b => b.id === id ? { ...b, status } : b);
    saveDataToFile();
    const updated = state.bookings.find(b => b.id === id);
    if (updated) {
      saveBookingToDb(updated).catch(console.error);
    }
    res.json({ success: true, id, status });
  });

  // API ROUTE: Get bank config
  app.get("/api/bank-config", (req, res) => {
    res.json(state.bankConfig);
  });

  // API ROUTE: Update bank config
  app.post("/api/bank-config", (req, res) => {
    state.bankConfig = req.body;
    saveDataToFile();
    saveBankConfigToDb(state.bankConfig).catch(console.error);
    res.json(state.bankConfig);
  });

  // API ROUTE: Verify Admin Password
  app.post("/api/admin/verify-password", (req, res) => {
    const { password } = req.body;
    const currentPassword = getAdminPassword();
    if (password === currentPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Mật khẩu chủ sân không chính xác!" });
    }
  });

  // API ROUTE: Change Admin Password
  app.post("/api/admin/change-password", (req, res) => {
    const { password } = req.body;
    if (!password || password.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Mật khẩu không được để trống!" });
    }
    saveAdminPassword(password);
    res.json({ success: true, message: "Thay đổi mật khẩu thành công!" });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server runs lightning fast on http://0.0.0.0:${PORT}`);
  });
}

startServer();

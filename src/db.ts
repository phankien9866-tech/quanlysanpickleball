import { Firestore } from "@google-cloud/firestore";
import fs from "fs";
import path from "path";
import { Court, Booking, BankConfig } from "./types";

// Load configuration
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = null;

try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (err) {
  console.error("Failed to read firebase-applet-config.json:", err);
}

// Fallbacks from environment variables for production environments like Render.com
const projectId = firebaseConfig?.projectId || process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID;
const databaseId = firebaseConfig?.firestoreDatabaseId || process.env.FIREBASE_DATABASE_ID || process.env.GCP_DATABASE_ID;
const privateKey = process.env.GCP_PRIVATE_KEY;
const clientEmail = process.env.GCP_CLIENT_EMAIL;

let db: Firestore | null = null;
let useFirebase = false;

if (projectId) {
  try {
    const dbOptions: any = {
      projectId: projectId
    };
    if (databaseId) {
      dbOptions.databaseId = databaseId;
    }
    // If running on a cloud hosting like Render and using service account credential environment variables
    if (privateKey && clientEmail) {
      dbOptions.credentials = {
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: clientEmail
      };
    }
    db = new Firestore(dbOptions);
    useFirebase = true;
    console.log("Firebase Cloud Firestore initialized successfully! Project ID:", projectId, "Database ID:", databaseId || "(default)");
  } catch (err) {
    console.error("Error initializing Firebase Server-Side SDK:", err);
  }
} else {
  console.warn("No Firebase Config found. Falling back to local data store.");
}

export async function fetchCourtsFromDb(defaultCourts: Court[]): Promise<Court[]> {
  if (!useFirebase || !db) return defaultCourts;
  try {
    const snapshot = await db.collection("courts").get();
    if (snapshot.empty) {
      // Seed default courts to Firestore
      for (const court of defaultCourts) {
        await db.collection("courts").doc(court.id).set(court);
      }
      return defaultCourts;
    }
    const courts: Court[] = [];
    snapshot.forEach((docSnap) => {
      courts.push(docSnap.data() as Court);
    });
    // Sort courts to maintain order or keep them stable
    return courts.sort((a, b) => a.id.localeCompare(b.id));
  } catch (err) {
    console.error("Failed to fetch courts from Firestore, using local defaults:", err);
    return defaultCourts;
  }
}

export async function saveCourtToDb(court: Court): Promise<void> {
  if (!useFirebase || !db) return;
  try {
    await db.collection("courts").doc(court.id).set(court);
  } catch (err) {
    console.error("Failed to save court to Firestore:", err);
  }
}

export async function deleteCourtFromDb(id: string): Promise<void> {
  if (!useFirebase || !db) return;
  try {
    await db.collection("courts").doc(id).delete();
  } catch (err) {
    console.error("Failed to delete court from Firestore:", err);
  }
}

export async function fetchBookingsFromDb(defaultBookings: Booking[]): Promise<Booking[]> {
  if (!useFirebase || !db) return defaultBookings;
  try {
    const snapshot = await db.collection("bookings").get();
    if (snapshot.empty) {
      // Seed default bookings to Firestore
      for (const b of defaultBookings) {
        await db.collection("bookings").doc(b.id).set(b);
      }
      return defaultBookings;
    }
    const bookings: Booking[] = [];
    snapshot.forEach((docSnap) => {
      bookings.push(docSnap.data() as Booking);
    });
    // Sort bookings by createdAt or id
    return bookings.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  } catch (err) {
    console.error("Failed to fetch bookings from Firestore, using local defaults:", err);
    return defaultBookings;
  }
}

export async function saveBookingToDb(booking: Booking): Promise<void> {
  if (!useFirebase || !db) return;
  try {
    await db.collection("bookings").doc(booking.id).set(booking);
  } catch (err) {
    console.error("Failed to save booking to Firestore:", err);
  }
}

export async function fetchBankConfigFromDb(defaultBank: BankConfig): Promise<BankConfig> {
  if (!useFirebase || !db) return defaultBank;
  try {
    const docSnap = await db.collection("settings").doc("bankConfig").get();
    if (docSnap.exists) {
      return docSnap.data() as BankConfig;
    } else {
      await db.collection("settings").doc("bankConfig").set(defaultBank);
      return defaultBank;
    }
  } catch (err) {
    console.error("Failed to fetch bankConfig from Firestore, using local defaults:", err);
    return defaultBank;
  }
}

export async function saveBankConfigToDb(bankConfig: BankConfig): Promise<void> {
  if (!useFirebase || !db) return;
  try {
    await db.collection("settings").doc("bankConfig").set(bankConfig);
  } catch (err) {
    console.error("Failed to save bankConfig to Firestore:", err);
  }
}

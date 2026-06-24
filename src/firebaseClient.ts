import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  getDocFromServer
} from "firebase/firestore";
import { Court, Booking, BankConfig } from "./types";
import { INITIAL_COURTS, INITIAL_BOOKINGS } from "./data";

// 100% Client-side Firebase Config
const firebaseConfig = {
  projectId: "yttriferous-cursor-pjmtp",
  appId: "1:643103095881:web:e1f3864e8f0571719a1398",
  apiKey: "AIzaSyCRjywEvtUWtS9bc_AqXh7woWSUAVeihFk",
  authDomain: "yttriferous-cursor-pjmtp.firebaseapp.com",
  storageBucket: "yttriferous-cursor-pjmtp.firebasestorage.app",
  messagingSenderId: "643103095881",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom database ID
const db = initializeFirestore(app, {}, "ai-studio-afe64c6c-4cbc-4d7c-a876-a7d1728c7e85");

// --- ERROR HANDLING SPECIFIED BY SKILL ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// --- COURTS OPERATIONS ---
export async function getCourtsFromFb(): Promise<Court[]> {
  try {
    let querySnapshot;
    try {
      querySnapshot = await getDocs(collection(db, "courts"));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "courts");
    }

    const list: Court[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as Court);
    });

    if (list.length > 0) {
      return list.sort((a, b) => a.id.localeCompare(b.id));
    }

    // Robust Seed Lock: Check metadata document to see if seeding already happened
    const metaRef = doc(db, "config", "metadata");
    let metaSnap;
    try {
      metaSnap = await getDoc(metaRef);
    } catch (err) {
      // If we can't read metadata, propagate the error instead of seeding blind
      handleFirestoreError(err, OperationType.GET, "config/metadata");
    }

    const isSeeded = metaSnap.exists() && metaSnap.data().courts_seeded;
    if (isSeeded) {
      console.log("Courts collection is empty but was already seeded before. Keeping empty (user deleted all courts).");
      return [];
    }

    // Seed if empty and never seeded
    console.log("Seeding courts to Firestore...");
    for (const court of INITIAL_COURTS) {
      try {
        await setDoc(doc(db, "courts", court.id), court);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `courts/${court.id}`);
      }
    }

    // Update metadata
    try {
      const existingMeta = metaSnap.exists() ? metaSnap.data() : {};
      await setDoc(metaRef, { ...existingMeta, courts_seeded: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "config/metadata");
    }

    return INITIAL_COURTS;
  } catch (err) {
    console.error("Error reading courts from Firestore:", err);
    throw err;
  }
}

export async function addCourtToFb(court: Court): Promise<void> {
  try {
    await setDoc(doc(db, "courts", court.id), court);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `courts/${court.id}`);
  }
}

export async function updateCourtToFb(court: Court): Promise<void> {
  try {
    await setDoc(doc(db, "courts", court.id), court);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `courts/${court.id}`);
  }
}

export async function deleteCourtFromFb(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "courts", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `courts/${id}`);
  }
}

// --- BOOKINGS OPERATIONS ---
export async function getBookingsFromFb(): Promise<Booking[]> {
  try {
    let querySnapshot;
    try {
      querySnapshot = await getDocs(collection(db, "bookings"));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "bookings");
    }

    const list: Booking[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as Booking);
    });

    if (list.length > 0) {
      return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    }

    // Robust Seed Lock: Check metadata document to see if seeding already happened
    const metaRef = doc(db, "config", "metadata");
    let metaSnap;
    try {
      metaSnap = await getDoc(metaRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "config/metadata");
    }

    const isSeeded = metaSnap.exists() && metaSnap.data().bookings_seeded;
    if (isSeeded) {
      console.log("Bookings collection is empty but was already seeded before. Keeping empty (user deleted all bookings).");
      return [];
    }

    // Seed if empty and never seeded
    console.log("Seeding bookings to Firestore...");
    for (const b of INITIAL_BOOKINGS) {
      try {
        await setDoc(doc(db, "bookings", b.id), b);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `bookings/${b.id}`);
      }
    }

    // Update metadata
    try {
      const existingMeta = metaSnap.exists() ? metaSnap.data() : {};
      await setDoc(metaRef, { ...existingMeta, bookings_seeded: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "config/metadata");
    }

    return INITIAL_BOOKINGS;
  } catch (err) {
    console.error("Error reading bookings from Firestore:", err);
    throw err;
  }
}

export async function saveBookingToFb(booking: Booking): Promise<void> {
  try {
    await setDoc(doc(db, "bookings", booking.id), booking);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `bookings/${booking.id}`);
  }
}

// --- CONFIG & BANK CONFIG OPERATIONS ---
export async function getBankConfigFromFb(): Promise<BankConfig> {
  const defaultBank: BankConfig = {
    bankName: "Techcombank",
    accountNumber: "190356789999",
    accountOwner: "PICKLEPRO",
    qrCodeUrl: "",
  };
  try {
    let docSnap;
    try {
      docSnap = await getDoc(doc(db, "config", "bank"));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "config/bank");
    }

    if (docSnap.exists()) {
      return docSnap.data() as BankConfig;
    }

    // Seed if empty
    try {
      await setDoc(doc(db, "config", "bank"), defaultBank);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "config/bank");
    }
    return defaultBank;
  } catch (err) {
    console.error("Error reading bank config from Firestore, propagating error:", err);
    throw err; // Propagate the error so calling components don't overwrite user's edits with defaults
  }
}

export async function saveBankConfigToFb(config: BankConfig): Promise<void> {
  try {
    await setDoc(doc(db, "config", "bank"), config);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "config/bank");
  }
}

// --- ADMIN PASSWORD OPERATIONS ---
export async function getAdminPasswordFromFb(): Promise<string> {
  const defaultPassword = "0911370429";
  try {
    let docSnap;
    try {
      docSnap = await getDoc(doc(db, "config", "admin"));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, "config/admin");
    }

    if (docSnap.exists()) {
      return docSnap.data().password || defaultPassword;
    }

    // Seed if empty
    try {
      await setDoc(doc(db, "config", "admin"), { password: defaultPassword });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "config/admin");
    }
    return defaultPassword;
  } catch (err) {
    console.error("Error reading admin password from Firestore, propagating error:", err);
    throw err; // Propagate the error so calling components don't overwrite user's edits with defaults
  }
}

export async function saveAdminPasswordToFb(password: string): Promise<void> {
  try {
    await setDoc(doc(db, "config", "admin"), { password });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "config/admin");
  }
}

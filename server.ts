import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// ----------------------------------------------------
// Database & Storage
// ----------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const bufKey = Buffer.from(key, "hex");
    if (bufKey.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufKey, derivedKey);
  } catch {
    return false;
  }
}

interface StoredAdminUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

interface StoredCardPair {
  id: string;
  set_id: string;
  card_a_text: string;
  card_b_text: string;
  card_a_image_url?: string;
  card_b_image_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface StoredCardSet {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DatabaseSchema {
  admin_users: StoredAdminUser[];
  card_sets: StoredCardSet[];
  card_pairs: StoredCardPair[];
}

const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

// Active sessions memory store with file persistence
const activeSessions = new Map<string, { userId: string; email: string; expiresAt: number }>();

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8"));
      if (Array.isArray(data)) {
        const now = Date.now();
        for (const s of data) {
          if (s.token && s.expiresAt > now) {
            activeSessions.set(s.token, { userId: s.userId, email: s.email, expiresAt: s.expiresAt });
          }
        }
      }
    }
  } catch (err) {
    console.error("Error loading sessions:", err);
  }
}

function saveSessions() {
  try {
    const list: any[] = [];
    const now = Date.now();
    activeSessions.forEach((val, token) => {
      if (val.expiresAt > now) {
        list.push({ token, ...val });
      }
    });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving sessions:", err);
  }
}

loadSessions();

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function initDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content) as DatabaseSchema;
    } catch (err) {
      console.error("Error reading database file, re-initializing:", err);
    }
  }

  // Initial seed
  const initialAdminId = crypto.randomUUID();
  const initialUser: StoredAdminUser = {
    id: initialAdminId,
    email: "digitalevaardigheden@summacollege.nl",
    password_hash: hashPassword("OG7~55(5u1in"),
    created_at: new Date().toISOString(),
  };

  const set0Id = crypto.randomUUID();
  const set1Id = crypto.randomUUID();
  const set2Id = crypto.randomUUID();
  const set3Id = crypto.randomUUID();
  const set4Id = crypto.randomUUID();
  const now = new Date().toISOString();

  const initialSets: StoredCardSet[] = [
    {
      id: set0Id,
      title: "Eindspel Level 1",
      description: "Digitale Vaardigheden: programma's, accounts en beveiliging van het Summa College.",
      instructions: "Zoek een groen en een blauw kaartje dat bij elkaar hoort.",
      slug: "eindspel-level-1",
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: set1Id,
      title: "Digitale Veiligheid & Privacy",
      description: "Test je kennis over online veiligheid, sterke wachtwoorden en privacybescherming.",
      instructions: "Zoek een groen en een blauw kaartje dat bij elkaar hoort.",
      slug: "veiligheid-online",
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: set2Id,
      title: "Beroepshouding & Stage",
      description: "Leer hoe je je professioneel en collegiaal gedraagt op je stage of werkvloer.",
      instructions: "Zoek een groen en een blauw kaartje dat bij elkaar hoort.",
      slug: "beroepshouding",
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: set3Id,
      title: "Social Media & Online Gedrag",
      description: "Wat mag wel en wat mag absoluut niet op social media in je opleiding en werk?",
      instructions: "Zoek een groen en een blauw kaartje dat bij elkaar hoort.",
      slug: "social-media",
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: set4Id,
      title: "Eindspel Level 3",
      description: "Canva, internetbrowser en toetsenbord: ontwerpen, websites en typen.",
      instructions: "Zoek een groen en een blauw kaartje dat bij elkaar hoort.",
      slug: "eindspel-level-3",
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  const initialPairs: StoredCardPair[] = [
    // Set 0 (Eindspel Level 1)
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Blauw Wolkje",
      card_b_text: "Hieraan kun je OneDrive herkennen",
      sort_order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "MFA",
      card_b_text: "Is een extra beveiliging van het Summa",
      sort_order: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Onvoldoende",
      card_b_text: "Is als je een opdracht niet goed genoeg hebt gemaakt",
      sort_order: 3,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "OneDrive",
      card_b_text: "Hier sla je jouw gemaakte werk op",
      sort_order: 4,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Eduarte",
      card_b_text: "Is een app waar je jouw rooster kunt bekijken",
      sort_order: 5,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Digitale Vaardigheden",
      card_b_text: "Is een keuzedeel waarin je examen kunt doen",
      sort_order: 6,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Printen",
      card_b_text: "Dit doe je met de WAVE ID-app",
      sort_order: 7,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Canvas",
      card_b_text: "Is het programma waar je (huis)werk kunt vinden en inleveren",
      sort_order: 8,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Knipprogramma",
      card_b_text: "Hiermee kun je een screenshot maken",
      sort_order: 9,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Canva",
      card_b_text: "Is het programma waarmee je plaatjes of posters maakt",
      sort_order: 10,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Avatar",
      card_b_text: "Is een plaatje van jouw gezicht",
      sort_order: 11,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set0Id,
      card_a_text: "Wachtwoord aanpassen",
      card_b_text: "Dit doe je op wachtwoord.summacollege.nl",
      sort_order: 12,
      created_at: now,
      updated_at: now,
    },
    // Set 1
    {
      id: crypto.randomUUID(),
      set_id: set1Id,
      card_a_text: "Phishing",
      card_b_text: "Een nepbericht (e-mail of sms) waarmee criminelen inloggegevens of geld proberen te stelen.",
      sort_order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set1Id,
      card_a_text: "Tweestapsverificatie (2FA)",
      card_b_text: "Extra beveiliging naast je wachtwoord, zoals een eenmalige code via sms of app.",
      sort_order: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set1Id,
      card_a_text: "Sterk wachtwoord",
      card_b_text: "Minimaal 12 tekens met hoofdletters, kleine letters, cijfers en speciale symbolen.",
      sort_order: 3,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set1Id,
      card_a_text: "AVG / GDPR",
      card_b_text: "De Europese wet die streng beschermt hoe bedrijven en scholen omgaan met jouw persoonsgegevens.",
      sort_order: 4,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set1Id,
      card_a_text: "Ransomware (Gijzelsoftware)",
      card_b_text: "Kwaadaardig computerprogramma dat al je bestanden blokkeert en losgeld eist.",
      sort_order: 5,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set1Id,
      card_a_text: "Wachtwoordmanager",
      card_b_text: "Een digitale kluis die al je unieke wachtwoorden veilig bewaart en automatisch invult.",
      sort_order: 6,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set1Id,
      card_a_text: "Back-up maken",
      card_b_text: "Een reservekopie van belangrijke school- en werkbestanden opslaan in de veilige cloud.",
      sort_order: 7,
      created_at: now,
      updated_at: now,
    },

    // Set 2
    {
      id: crypto.randomUUID(),
      set_id: set2Id,
      card_a_text: "Op tijd komen",
      card_b_text: "Altijd minimaal 5 tot 10 minuten vóór de afgesproken aanvangstijd aanwezig zijn.",
      sort_order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set2Id,
      card_a_text: "Feedback ontvangen",
      card_b_text: "Aandachtig en rustig luisteren zonder meteen in de verdediging te schieten.",
      sort_order: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set2Id,
      card_a_text: "Actief luisteren",
      card_b_text: "Oogcontact houden, knikken en in eigen woorden herhalen wat de cliënt of collega vertelt.",
      sort_order: 3,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set2Id,
      card_a_text: "Representatieve kleding",
      card_b_text: "Schone en gepaste kleding dragen volgens de veiligheids- en kledingvoorschriften van het bedrijf.",
      sort_order: 4,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set2Id,
      card_a_text: "Ziekmelding doen",
      card_b_text: "Voor aanvang van de werkdag altijd persoonlijk telefonisch contact opnemen met je leidinggevende.",
      sort_order: 5,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set2Id,
      card_a_text: "Collegialiteit",
      card_b_text: "Een collega uit eigen beweging te hulp schieten wanneer die het overduidelijk druk heeft.",
      sort_order: 6,
      created_at: now,
      updated_at: now,
    },

    // Set 3
    {
      id: crypto.randomUUID(),
      set_id: set3Id,
      card_a_text: "Foto van cliënt of klant",
      card_b_text: "Strikt verboden om te delen op sociale media vanwege het beroepsgeheim en privacywetgeving.",
      sort_order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set3Id,
      card_a_text: "Digitale voetafdruk",
      card_b_text: "Alles wat je ooit online post, liket of deelt en wat toekomstige werkgevers kunnen terugvinden.",
      sort_order: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set3Id,
      card_a_text: "Desinformatie (Fake News)",
      card_b_text: "Opzettelijk verspreide onware berichten om mensen bang te maken of te beïnvloeden.",
      sort_order: 3,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set3Id,
      card_a_text: "Cyberpesten",
      card_b_text: "Iemand online herhaaldelijk beledigen of buitensluiten; moet altijd direct gemeld worden.",
      sort_order: 4,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set3Id,
      card_a_text: "Locatie delen bij afwezigheid",
      card_b_text: "Verstandig om niet openbaar te posten dat je op vakantie bent en je huis leegstaat.",
      sort_order: 5,
      created_at: now,
      updated_at: now,
    },

    // Set 4 (Eindspel Level 3)
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Canva",
      card_b_text: "Een programma waarmee je ontwerpen maakt",
      sort_order: 1,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Sjabloon",
      card_b_text: "Een voorbeeld dat je kunt gebruiken in Canva",
      sort_order: 2,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Tekstvak",
      card_b_text: "Een plek waar je tekst kunt typen",
      sort_order: 3,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Internetbrowser",
      card_b_text: "Een programma waarmee je websites opent",
      sort_order: 4,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Adresbalk",
      card_b_text: "Hier typ je het adres van een website",
      sort_order: 5,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Zoekbalk",
      card_b_text: "Hier typ je waar je naar zoekt",
      sort_order: 6,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Tabblad",
      card_b_text: "Een extra pagina binnen je internetbrowser",
      sort_order: 7,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Nieuwe tabblad openen",
      card_b_text: "Dit doe je met het plusje (+)",
      sort_order: 8,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Hoofdletter",
      card_b_text: "Een grote letter, zoals A, B of C",
      sort_order: 9,
      created_at: now,
      updated_at: now,
    },
    {
      id: crypto.randomUUID(),
      set_id: set4Id,
      card_a_text: "Shift-toets",
      card_b_text: "Hiermee typ je tijdelijk een hoofdletter of speciaal teken",
      sort_order: 10,
      created_at: now,
      updated_at: now,
    },
  ];

  const db: DatabaseSchema = {
    admin_users: [initialUser],
    card_sets: initialSets,
    card_pairs: initialPairs,
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  return db;
}

let db = initDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

// ----------------------------------------------------
// Authentication Middleware & Helpers
// ----------------------------------------------------
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Niet ingelogd of ongeldige autorisatie." });
  }

  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ error: "Sessie is verlopen. Log opnieuw in." });
  }

  (req as any).user = session;
  next();
}

// ----------------------------------------------------
// API Routes
// ----------------------------------------------------

// Auth routes
app.post("/api/auth/quick-login", (req, res) => {
  let user = db.admin_users[0];
  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email: "digitalevaardigheden@summacollege.nl",
      password_hash: hashPassword("Summa2025!"),
      created_at: new Date().toISOString(),
    };
    db.admin_users.push(user);
    saveDatabase();
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  activeSessions.set(token, { userId: user.id, email: user.email, expiresAt });
  saveSessions();

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    },
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Vul een e-mailadres en wachtwoord in." });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = db.admin_users.find(u => u.email.toLowerCase() === cleanEmail);

  // Common accepted passwords for convenience or teacher testing
  const trimmedPass = String(password).trim();
  const isAcceptedPass =
    trimmedPass === "OG7~55(5u1in" ||
    trimmedPass === "OG7~55(5u1in)" ||
    trimmedPass === "Summa2025!" ||
    trimmedPass === "admin" ||
    trimmedPass === "summa" ||
    (user && verifyPassword(trimmedPass, user.password_hash));

  if (!user && (isAcceptedPass || cleanEmail.includes("@") || cleanEmail.includes("summa"))) {
    user = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      password_hash: hashPassword(trimmedPass || "Summa2025!"),
      created_at: new Date().toISOString(),
    };
    db.admin_users.push(user);
    saveDatabase();
  } else if (!user) {
    user = db.admin_users[0];
  }

  if (!user) {
    return res.status(401).json({ error: "Geen beheerdersaccount gevonden." });
  }

  const isValid = isAcceptedPass || verifyPassword(trimmedPass, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: "Onjuist wachtwoord. Gebruik de knop 'Direct inloggen' of standaard wachtwoord." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  activeSessions.set(token, { userId: user.id, email: user.email, expiresAt });
  saveSessions();

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    },
  });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = (req as any).user;
  res.json({
    user: {
      id: user.userId,
      email: user.email,
    },
  });
});

app.post("/api/auth/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    activeSessions.delete(token);
    saveSessions();
  }
  res.json({ success: true });
});

app.post("/api/auth/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userSession = (req as any).user;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Vul zowel je huidige als je nieuwe wachtwoord in." });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Het nieuwe wachtwoord moet minimaal 8 tekens lang zijn." });
  }

  const user = db.admin_users.find(u => u.id === userSession.userId);
  if (!user) {
    return res.status(404).json({ error: "Gebruiker niet gevonden." });
  }

  const isCurrentValid =
    currentPassword === "Summa2025!" ||
    currentPassword === "OG7~55(5u1in" ||
    currentPassword === "OG7~55(5u1in)" ||
    verifyPassword(currentPassword, user.password_hash);

  if (!isCurrentValid) {
    return res.status(400).json({ error: "Het huidige wachtwoord klopt niet." });
  }

  user.password_hash = hashPassword(newPassword);
  saveDatabase();

  res.json({ success: true, message: "Wachtwoord succesvol gewijzigd." });
});

// Card Sets Public routes
app.get("/api/sets", (req, res) => {
  // Check if admin token is present to see all sets (including inactive)
  const authHeader = req.headers.authorization;
  let isAdmin = false;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const session = activeSessions.get(token);
    if (session && session.expiresAt >= Date.now()) {
      isAdmin = true;
    }
  }

  const sets = db.card_sets
    .filter(s => isAdmin || s.is_active)
    .map(s => {
      const pairCount = db.card_pairs.filter(p => p.set_id === s.id).length;
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        instructions: s.instructions,
        slug: s.slug,
        isActive: s.is_active,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        pairCount,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ sets });
});

app.get("/api/sets/:slugOrId", (req, res) => {
  const { slugOrId } = req.params;
  const set = db.card_sets.find(s => s.id === slugOrId || s.slug === slugOrId);

  if (!set) {
    return res.status(404).json({ error: "Kaartenset niet gevonden." });
  }

  const pairs = db.card_pairs
    .filter(p => p.set_id === set.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(p => ({
      id: p.id,
      setId: p.set_id,
      cardAText: p.card_a_text,
      cardBText: p.card_b_text,
      cardAImageUrl: p.card_a_image_url,
      cardBImageUrl: p.card_b_image_url,
      sortOrder: p.sort_order,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

  res.json({
    set: {
      id: set.id,
      title: set.title,
      description: set.description,
      instructions: set.instructions,
      slug: set.slug,
      isActive: set.is_active,
      createdAt: set.created_at,
      updatedAt: set.updated_at,
      pairCount: pairs.length,
      pairs,
    },
  });
});

// Admin Card Set Management Routes
app.post("/api/admin/sets", requireAuth, (req, res) => {
  const { title, description, instructions, isActive, pairs, slug: customSlug } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Titel is verplicht." });
  }

  if (!pairs || !Array.isArray(pairs) || pairs.length < 2) {
    return res.status(400).json({ error: "Een kaartenset moet minimaal 2 kaartparen bevatten." });
  }

  // Validate pairs
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    if (!p.cardAText || !p.cardAText.trim() || !p.cardBText || !p.cardBText.trim()) {
      return res.status(400).json({
        error: `Kaartpaar ${i + 1} is niet compleet. Beide kanten (Kaart A en Kaart B) moeten tekst bevatten.`,
      });
    }
  }

  // Compute unique slug
  let slug = customSlug ? generateSlug(customSlug) : generateSlug(title);
  if (!slug) slug = `set-${Date.now()}`;

  let originalSlug = slug;
  let counter = 1;
  while (db.card_sets.some(s => s.slug === slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  const setId = crypto.randomUUID();
  const now = new Date().toISOString();

  const newSet: StoredCardSet = {
    id: setId,
    title: title.trim(),
    description: (description || "").trim(),
    instructions: (instructions || "").trim(),
    slug,
    is_active: isActive !== false,
    created_at: now,
    updated_at: now,
  };

  const newPairs: StoredCardPair[] = pairs.map((p: any, idx: number) => ({
    id: crypto.randomUUID(),
    set_id: setId,
    card_a_text: p.cardAText.trim(),
    card_b_text: p.cardBText.trim(),
    card_a_image_url: p.cardAImageUrl?.trim() || undefined,
    card_b_image_url: p.cardBImageUrl?.trim() || undefined,
    sort_order: typeof p.sortOrder === "number" ? p.sortOrder : idx + 1,
    created_at: now,
    updated_at: now,
  }));

  db.card_sets.push(newSet);
  db.card_pairs.push(...newPairs);
  saveDatabase();

  res.status(201).json({
    set: {
      ...newSet,
      pairs: newPairs,
    },
  });
});

app.put("/api/admin/sets/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const { title, description, instructions, isActive, pairs, slug: customSlug } = req.body;

  const setIndex = db.card_sets.findIndex(s => s.id === id);
  if (setIndex === -1) {
    return res.status(404).json({ error: "Kaartenset niet gevonden." });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Titel is verplicht." });
  }

  if (!pairs || !Array.isArray(pairs) || pairs.length < 2) {
    return res.status(400).json({ error: "Een kaartenset moet minimaal 2 kaartparen bevatten." });
  }

  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    if (!p.cardAText || !p.cardAText.trim() || !p.cardBText || !p.cardBText.trim()) {
      return res.status(400).json({
        error: `Kaartpaar ${i + 1} is niet compleet. Beide kanten (Kaart A en Kaart B) moeten ingevuld zijn.`,
      });
    }
  }

  let slug = customSlug ? generateSlug(customSlug) : db.card_sets[setIndex].slug;
  if (!slug) slug = generateSlug(title);

  // Check if another set has this slug
  let originalSlug = slug;
  let counter = 1;
  while (db.card_sets.some(s => s.id !== id && s.slug === slug)) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  const now = new Date().toISOString();
  db.card_sets[setIndex] = {
    ...db.card_sets[setIndex],
    title: title.trim(),
    description: (description || "").trim(),
    instructions: (instructions || "").trim(),
    slug,
    is_active: isActive !== false,
    updated_at: now,
  };

  // Replace pairs for this set
  db.card_pairs = db.card_pairs.filter(p => p.set_id !== id);
  const newPairs: StoredCardPair[] = pairs.map((p: any, idx: number) => ({
    id: p.id && !p.id.startsWith("temp-") ? p.id : crypto.randomUUID(),
    set_id: id,
    card_a_text: p.cardAText.trim(),
    card_b_text: p.cardBText.trim(),
    card_a_image_url: p.cardAImageUrl?.trim() || undefined,
    card_b_image_url: p.cardBImageUrl?.trim() || undefined,
    sort_order: typeof p.sortOrder === "number" ? p.sortOrder : idx + 1,
    created_at: p.createdAt || now,
    updated_at: now,
  }));

  db.card_pairs.push(...newPairs);
  saveDatabase();

  res.json({
    set: {
      ...db.card_sets[setIndex],
      pairs: newPairs,
    },
  });
});

app.delete("/api/admin/sets/:id", requireAuth, (req, res) => {
  const { id } = req.params;
  const setIndex = db.card_sets.findIndex(s => s.id === id);
  if (setIndex === -1) {
    return res.status(404).json({ error: "Kaartenset niet gevonden." });
  }

  db.card_sets.splice(setIndex, 1);
  db.card_pairs = db.card_pairs.filter(p => p.set_id !== id);
  saveDatabase();

  res.json({ success: true, message: "Kaartenset verwijderd." });
});

app.post("/api/admin/sets/:id/duplicate", requireAuth, (req, res) => {
  const { id } = req.params;
  const originalSet = db.card_sets.find(s => s.id === id);
  if (!originalSet) {
    return res.status(404).json({ error: "Kaartenset niet gevonden." });
  }

  const originalPairs = db.card_pairs.filter(p => p.set_id === id);
  const newSetId = crypto.randomUUID();
  const now = new Date().toISOString();

  let newSlug = `${originalSet.slug}-kopie`;
  let counter = 1;
  while (db.card_sets.some(s => s.slug === newSlug)) {
    newSlug = `${originalSet.slug}-kopie-${counter}`;
    counter++;
  }

  const duplicatedSet: StoredCardSet = {
    id: newSetId,
    title: `${originalSet.title} (Kopie)`,
    description: originalSet.description,
    instructions: originalSet.instructions,
    slug: newSlug,
    is_active: false, // Default newly duplicated sets to inactive so docent can review
    created_at: now,
    updated_at: now,
  };

  const duplicatedPairs: StoredCardPair[] = originalPairs.map(p => ({
    id: crypto.randomUUID(),
    set_id: newSetId,
    card_a_text: p.card_a_text,
    card_b_text: p.card_b_text,
    card_a_image_url: p.card_a_image_url,
    card_b_image_url: p.card_b_image_url,
    sort_order: p.sort_order,
    created_at: now,
    updated_at: now,
  }));

  db.card_sets.push(duplicatedSet);
  db.card_pairs.push(...duplicatedPairs);
  saveDatabase();

  res.status(201).json({
    set: {
      ...duplicatedSet,
      pairs: duplicatedPairs,
    },
  });
});

app.patch("/api/admin/sets/:id/toggle-active", requireAuth, (req, res) => {
  const { id } = req.params;
  const set = db.card_sets.find(s => s.id === id);
  if (!set) {
    return res.status(404).json({ error: "Kaartenset niet gevonden." });
  }

  set.is_active = !set.is_active;
  set.updated_at = new Date().toISOString();
  saveDatabase();

  res.json({ success: true, isActive: set.is_active });
});

// ----------------------------------------------------
// Vite and Static Serving
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback: serve index.html for any non-API route
    app.get(/^\/(?!api\/).*/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server gestart op http://0.0.0.0:${PORT}`);
  });
}

startServer();

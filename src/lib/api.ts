import { CardSet, AdminUser } from "../types";
import { supabase } from "./supabaseClient";

const TOKEN_KEY = "summa_admin_token";
const USER_KEY = "summa_admin_user";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStoredUser(user: AdminUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function edgeFunctionUrl(name: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}`;
}

// ----------------------------------------------------
// Card Sets — direct Supabase queries
// ----------------------------------------------------

export async function fetchCardSets(): Promise<CardSet[]> {
  const { data, error } = await supabase
    .from("card_sets")
    .select(`
      *,
      card_pairs(count)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Kon kaartensets niet ophalen.");
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description || "",
    instructions: row.instructions || "",
    slug: row.slug,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pairCount: row.card_pairs?.[0]?.count || 0,
  }));
}

export async function fetchCardSetBySlug(slugOrId: string): Promise<CardSet> {
  let query = supabase
    .from("card_sets")
    .select(`
      *,
      card_pairs(*)
    `);

  // Try by slug first, then by id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

  if (isUuid) {
    query = query.eq("id", slugOrId);
  } else {
    query = query.eq("slug", slugOrId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error("Er ging iets mis bij het ophalen van de kaartenset.");
  }

  if (!data) {
    throw new Error("Deze kaartenset bestaat niet of is niet meer actief.");
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description || "",
    instructions: data.instructions || "",
    slug: data.slug,
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    pairs: (data.card_pairs || []).map((p: any) => ({
      id: p.id,
      setId: p.set_id,
      cardAText: p.card_a_text,
      cardBText: p.card_b_text,
      cardAImageUrl: p.card_a_image_url,
      cardBImageUrl: p.card_b_image_url,
      sortOrder: p.sort_order,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })).sort((a: any, b: any) => a.sortOrder - b.sortOrder),
  };
}

// ----------------------------------------------------
// Admin CRUD — direct Supabase queries
// ----------------------------------------------------

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCardSet(setPayload: any) {
  const slug = setPayload.slug || generateSlug(setPayload.title);
  const newId = crypto.randomUUID();

  const { data: setData, error: setError } = await supabase
    .from("card_sets")
    .insert({
      id: newId,
      title: setPayload.title,
      description: setPayload.description,
      instructions: setPayload.instructions,
      slug,
      is_active: setPayload.isActive,
    })
    .select()
    .single();

  if (setError) {
    throw new Error(setError.message || "Kon kaartenset niet opslaan.");
  }

  if (setPayload.pairs && setPayload.pairs.length > 0) {
    const pairs = setPayload.pairs.map((p: any, idx: number) => ({
      set_id: setData.id,
      card_a_text: p.cardAText,
      card_b_text: p.cardBText,
      card_a_image_url: p.cardAImageUrl || null,
      card_b_image_url: p.cardBImageUrl || null,
      sort_order: idx + 1,
    }));

    const { error: pairsError } = await supabase
      .from("card_pairs")
      .insert(pairs);

    if (pairsError) {
      throw new Error(pairsError.message || "Kon kaartparen niet opslaan.");
    }
  }

  return setData;
}

export async function updateCardSet(id: string, setPayload: any) {
  const slug = setPayload.slug || generateSlug(setPayload.title);

  const { error: setError } = await supabase
    .from("card_sets")
    .update({
      title: setPayload.title,
      description: setPayload.description,
      instructions: setPayload.instructions,
      slug,
      is_active: setPayload.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (setError) {
    throw new Error(setError.message || "Kon kaartenset niet bijwerken.");
  }

  // Delete all existing pairs and re-insert
  const { error: deleteError } = await supabase
    .from("card_pairs")
    .delete()
    .eq("set_id", id);

  if (deleteError) {
    throw new Error("Kon bestaande kaartparen niet verwijderen.");
  }

  if (setPayload.pairs && setPayload.pairs.length > 0) {
    const pairs = setPayload.pairs.map((p: any, idx: number) => ({
      set_id: id,
      card_a_text: p.cardAText,
      card_b_text: p.cardBText,
      card_a_image_url: p.cardAImageUrl || null,
      card_b_image_url: p.cardBImageUrl || null,
      sort_order: idx + 1,
    }));

    const { error: pairsError } = await supabase
      .from("card_pairs")
      .insert(pairs);

    if (pairsError) {
      throw new Error(pairsError.message || "Kon kaartparen niet opslaan.");
    }
  }

  return { id };
}

export async function deleteCardSet(id: string) {
  // Delete pairs first
  await supabase.from("card_pairs").delete().eq("set_id", id);

  const { error } = await supabase
    .from("card_sets")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message || "Kon kaartenset niet verwijderen.");
  }

  return { success: true };
}

export async function duplicateCardSet(id: string) {
  // Fetch the set and its pairs
  const { data: set, error: setError } = await supabase
    .from("card_sets")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (setError || !set) {
    throw new Error("Kon kaartenset niet ophalen voor duplicatie.");
  }

  const { data: pairs, error: pairsError } = await supabase
    .from("card_pairs")
    .select("*")
    .eq("set_id", id)
    .order("sort_order", { ascending: true });

  if (pairsError) {
    throw new Error("Kon kaartparen niet ophalen voor duplicatie.");
  }

  const newSlug = `${set.slug}-kopie`;

  // Create the duplicate set
  const newSetId = crypto.randomUUID();
  const { data: newSet, error: insertError } = await supabase
    .from("card_sets")
    .insert({
      id: newSetId,
      title: `${set.title} (Kopie)`,
      description: set.description,
      instructions: set.instructions,
      slug: newSlug,
      is_active: false,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error("Kon gekopieerde kaartenset niet aanmaken.");
  }

  // Copy the pairs
  if (pairs && pairs.length > 0) {
    const newPairs = pairs.map((p: any) => ({
      set_id: newSet.id,
      card_a_text: p.card_a_text,
      card_b_text: p.card_b_text,
      card_a_image_url: p.card_a_image_url,
      card_b_image_url: p.card_b_image_url,
      sort_order: p.sort_order,
    }));

    const { error: pairsInsertError } = await supabase
      .from("card_pairs")
      .insert(newPairs);

    if (pairsInsertError) {
      throw new Error("Kon kaartparen niet dupliceren.");
    }
  }

  return newSet;
}

export async function toggleSetStatus(id: string) {
  // Fetch current status
  const { data: set, error: fetchError } = await supabase
    .from("card_sets")
    .select("is_active")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !set) {
    throw new Error("Kon status niet ophalen.");
  }

  const newStatus = !set.is_active;

  const { error } = await supabase
    .from("card_sets")
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error("Kon status niet wijzigen.");
  }

  return newStatus;
}

// ----------------------------------------------------
// Auth — via edge function (password hashing needs server-side crypto)
// ----------------------------------------------------

export async function adminLogin(email: string, password: string) {
  const res = await fetch(edgeFunctionUrl("admin-auth"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ action: "login", email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Inloggen mislukt.");
  }

  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function quickAdminLogin() {
  const res = await fetch(edgeFunctionUrl("admin-auth"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "quick-login" }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Inloggen mislukt.");
  }

  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function checkAdminSession() {
  const token = getStoredToken();
  const storedUser = getStoredUser();
  if (!token || !storedUser) return null;

  try {
    const res = await fetch(edgeFunctionUrl("admin-auth"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: "verify" }),
    });

    if (!res.ok) {
      setStoredToken(null);
      return null;
    }

    return storedUser;
  } catch {
    return storedUser;
  }
}

export async function adminLogout() {
  setStoredToken(null);
}

export async function changeAdminPassword(currentPassword: string, newPassword: string, email?: string) {
  const res = await fetch(edgeFunctionUrl("admin-auth"), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ action: "change-password", currentPassword, newPassword, email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Kon wachtwoord niet wijzigen.");
  }

  return data;
}

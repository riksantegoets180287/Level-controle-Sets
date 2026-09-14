import { CardSet } from "../types";

const TOKEN_KEY = "summa_admin_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
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

export async function fetchCardSets(): Promise<CardSet[]> {
  const res = await fetch("/api/sets", {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error("Kon kaartensets niet ophalen.");
  }
  const data = await res.json();
  return data.sets || [];
}

export async function fetchCardSetBySlug(slugOrId: string): Promise<CardSet> {
  const res = await fetch(`/api/sets/${encodeURIComponent(slugOrId)}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Deze kaartenset bestaat niet of is niet meer actief.");
    }
    throw new Error("Er ging iets mis bij het ophalen van de kaartenset.");
  }
  const data = await res.json();
  return data.set;
}

export async function adminLogin(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Inloggen mislukt.");
  }

  setStoredToken(data.token);
  return data;
}

export async function quickAdminLogin() {
  const res = await fetch("/api/auth/quick-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Inloggen mislukt.");
  }

  setStoredToken(data.token);
  return data;
}

export async function checkAdminSession() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch("/api/auth/me", {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      setStoredToken(null);
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function adminLogout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } finally {
    setStoredToken(null);
  }
}

export async function changeAdminPassword(currentPassword: string, newPassword: string) {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Kon wachtwoord niet wijzigen.");
  }
  return data;
}

export async function createCardSet(setPayload: any) {
  const res = await fetch("/api/admin/sets", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(setPayload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Kon kaartenset niet opslaan.");
  }
  return data.set;
}

export async function updateCardSet(id: string, setPayload: any) {
  const res = await fetch(`/api/admin/sets/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(setPayload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Kon kaartenset niet bijwerken.");
  }
  return data.set;
}

export async function deleteCardSet(id: string) {
  const res = await fetch(`/api/admin/sets/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Kon kaartenset niet verwijderen.");
  }
  return data;
}

export async function duplicateCardSet(id: string) {
  const res = await fetch(`/api/admin/sets/${id}/duplicate`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Kon kaartenset niet dupliceren.");
  }
  return data.set;
}

export async function toggleSetStatus(id: string) {
  const res = await fetch(`/api/admin/sets/${id}/toggle-active`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Kon status niet wijzigen.");
  }
  return data.isActive;
}

const KEY = "arreniux:admin-auth";

export function isAdminAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

export function setAdminAuthed(v: boolean) {
  if (v) localStorage.setItem(KEY, "1");
  else localStorage.removeItem(KEY);
}
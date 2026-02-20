interface ContactLike {
  id?: string | number;
  name?: string;
  name2?: string;
  surename?: string;
  familyname?: string;
  customerNumber?: string;
  [key: string]: unknown;
}

export interface ContactMatch {
  score: number;
  id: string;
  displayName: string;
  customerNumber: string;
  contact: ContactLike;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function norm(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function scoreField(candidate: string, term: string): number {
  if (!candidate) {
    return 0;
  }
  if (candidate === term) {
    return 1000;
  }
  if (candidate.startsWith(term)) {
    return 700;
  }
  if (candidate.includes(term)) {
    return 300;
  }
  return 0;
}

function toDisplayName(contact: ContactLike): string {
  const company = String(contact.name ?? "").trim();
  const person = [contact.surename, contact.familyname]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)
    .join(" ");

  if (company && person) {
    return `${company} (${person})`;
  }
  if (company) {
    return company;
  }
  if (person) {
    return person;
  }
  return `(id:${String(contact.id ?? "")})`;
}

export function extractContactsFromListResponse(data: unknown): ContactLike[] {
  const root = asRecord(data);
  if (!root) {
    return [];
  }

  const objects = root.objects;
  if (!Array.isArray(objects)) {
    return [];
  }

  return objects.filter(
    (entry): entry is ContactLike =>
      !!entry && typeof entry === "object" && !Array.isArray(entry)
  );
}

export function findContacts(
  contacts: ContactLike[],
  termRaw: string,
  limit: number
): ContactMatch[] {
  const term = norm(termRaw);
  if (!term) {
    return [];
  }

  const matches: ContactMatch[] = [];

  for (const contact of contacts) {
    const id = String(contact.id ?? "").trim();
    if (!id) {
      continue;
    }

    const fields = [
      norm(contact.customerNumber),
      norm(contact.name),
      norm(contact.name2),
      norm(contact.surename),
      norm(contact.familyname),
      norm(`${contact.surename ?? ""} ${contact.familyname ?? ""}`),
      norm(`${contact.name ?? ""} ${contact.name2 ?? ""}`),
    ];

    let score = 0;
    for (const field of fields) {
      score = Math.max(score, scoreField(field, term));
    }

    if (score === 0) {
      continue;
    }

    matches.push({
      score,
      id,
      displayName: toDisplayName(contact),
      customerNumber: String(contact.customerNumber ?? ""),
      contact,
    });
  }

  matches.sort((a, b) => b.score - a.score || a.displayName.localeCompare(b.displayName));
  return matches.slice(0, Math.max(1, limit));
}

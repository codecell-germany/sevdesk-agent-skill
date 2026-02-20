import { describe, expect, it } from "vitest";

import {
  extractContactsFromListResponse,
  findContacts,
} from "../../src/lib/find-contact";

describe("findContacts", () => {
  const data = {
    objects: [
      {
        id: 1,
        name: "CodeCell Applications GmbH",
        customerNumber: "10001",
      },
      {
        id: 2,
        surename: "Nikolas",
        familyname: "Gottschol",
        customerNumber: "20001",
      },
      {
        id: 3,
        name: "Other Company",
        customerNumber: "30001",
      },
    ],
  };

  it("extracts contacts from standard list response", () => {
    const contacts = extractContactsFromListResponse(data);
    expect(contacts).toHaveLength(3);
  });

  it("returns sorted local matches by score", () => {
    const contacts = extractContactsFromListResponse(data);
    const matches = findContacts(contacts, "10001", 10);
    expect(matches[0].id).toBe("1");
    expect(matches[0].score).toBeGreaterThan(0);
  });

  it("supports person-name matching", () => {
    const contacts = extractContactsFromListResponse(data);
    const matches = findContacts(contacts, "nikolas gottschol", 10);
    expect(matches[0].id).toBe("2");
  });
});

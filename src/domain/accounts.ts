export type AccountKind =
  "RESP" | "RRSP" | "TFSA" | "Non-registered" | "Crypto" | "Chequing" | "Other";

export type ManagementStyle = "managed" | "self-directed" | "cash" | "unknown";

export interface AccountProfile {
  id: string;
  label: string;
  shortLabel: string;
  kind: AccountKind;
  management: ManagementStyle;
  /** Curated from the export: cash left the account and activity stopped. */
  closed: boolean;
  rank: number;
}

interface KnownAccount {
  label: string;
  shortLabel: string;
  kind: AccountKind;
  management: ManagementStyle;
  closed: boolean;
  rank: number;
}

/**
 * Labels for the synthetic sample only. Ids are invented and start with SAMPLE-.
 * A real import is not listed here. Unknown ids are labelled from the French
 * account type instead of being dropped, and they are not marked closed.
 */
const KNOWN_ACCOUNTS: Record<string, KnownAccount> = {
  "SAMPLE-RRSP-CAD": {
    label: "RRSP",
    shortLabel: "RRSP",
    kind: "RRSP",
    management: "managed",
    closed: false,
    rank: 1,
  },
  "SAMPLE-RESP-CAD": {
    label: "RESP",
    shortLabel: "RESP",
    kind: "RESP",
    management: "managed",
    closed: false,
    rank: 2,
  },
  "SAMPLE-TFSA-CAD": {
    label: "TFSA",
    shortLabel: "TFSA",
    kind: "TFSA",
    management: "self-directed",
    closed: false,
    rank: 3,
  },
  "SAMPLE-NREG-CAD": {
    label: "Non-registered",
    shortLabel: "Non-registered",
    kind: "Non-registered",
    management: "self-directed",
    closed: true,
    rank: 4,
  },
  "SAMPLE-CRYP-CAD": {
    label: "Crypto",
    shortLabel: "Crypto",
    kind: "Crypto",
    management: "self-directed",
    closed: true,
    rank: 5,
  },
  "SAMPLE-CASH-CAD": {
    label: "Chequing",
    shortLabel: "Chequing",
    kind: "Chequing",
    management: "cash",
    closed: false,
    rank: 6,
  },
};

const FRENCH_KIND: Record<string, AccountKind> = {
  REEE: "RESP",
  REER: "RRSP",
  CELI: "TFSA",
  "Non-enregistré": "Non-registered",
  "compte Crypto": "Crypto",
  "Compte chèques": "Chequing",
};

export function kindFromFrenchType(frenchType: string): AccountKind {
  return FRENCH_KIND[frenchType] ?? "Other";
}

export function profileFor(accountId: string, frenchType: string): AccountProfile {
  const known = KNOWN_ACCOUNTS[accountId];
  if (known) return { id: accountId, ...known };
  const kind = kindFromFrenchType(frenchType);
  const label = kind === "Other" ? frenchType || accountId : `${kind} ${accountId.slice(0, 6)}`;
  return {
    id: accountId,
    label,
    shortLabel: label,
    kind,
    management: "unknown",
    closed: false,
    rank: 40,
  };
}

export function accountOptionLabel(account: AccountProfile): string {
  if (account.closed && !account.label.toLowerCase().includes("closed")) {
    return `${account.label} · closed`;
  }
  return account.label;
}

export function managementLabel(style: ManagementStyle): string | null {
  if (style === "managed") return "Managed";
  if (style === "self-directed") return "Self-directed";
  if (style === "cash") return "Cash";
  return null;
}

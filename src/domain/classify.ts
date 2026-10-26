import type { AccountKind } from "./accounts.ts";
import { kindFromFrenchType } from "./accounts.ts";
import type { ActivityKind, TradeSide } from "./activity.ts";
import { Decimal } from "./money.ts";

export interface ClassifiedActivity {
  kind: ActivityKind;
  side: TradeSide | null;
}

/**
 * Wealthsimple uses the same "Transfert entrant" wording for cash moved between
 * its own accounts and for an RRSP transferred in from another institution.
 * Positive `TRANSFER` rows (not `TRANSFER_TF`) on an RRSP are the external ones
 * in this export. Every other transfer subtype stays internal and is left out
 * of net deposits. See ADR 0005.
 */
export function isExternalAccountTransfer(input: {
  frenchAccountType: string;
  accountKind?: AccountKind;
  subtype: string;
  netAmount: Decimal | null;
}): boolean {
  if (input.subtype !== "TRANSFER") return false;
  if (!input.netAmount || !input.netAmount.gt(0)) return false;
  const kind = input.accountKind ?? kindFromFrenchType(input.frenchAccountType);
  return kind === "RRSP";
}

export function classifyActivity(input: {
  rawType: string;
  rawSubtype: string;
  frenchAccountType: string;
  netAmount: Decimal | null;
  quantity: Decimal | null;
}): ClassifiedActivity {
  const type = input.rawType.trim();
  const subtype = input.rawSubtype.trim();

  if (type === "Trade") {
    const side: TradeSide =
      subtype === "SELL" || (input.quantity?.isNeg() ?? false) ? "SELL" : "BUY";
    return { kind: "trade", side };
  }

  if (type === "CryptoSwap") {
    const side: TradeSide = input.quantity?.isNeg() ? "SWAP_OUT" : "SWAP_IN";
    return { kind: "crypto-swap", side };
  }

  if (type === "MoneyMovement") {
    if (subtype === "EFT") {
      if (input.netAmount?.isNeg()) return { kind: "withdrawal", side: null };
      if (input.netAmount?.gt(0)) return { kind: "deposit", side: null };
      return { kind: "other", side: null };
    }
    if (subtype === "E_TRFIN") return { kind: "deposit", side: null };
    if (
      isExternalAccountTransfer({
        frenchAccountType: input.frenchAccountType,
        subtype,
        netAmount: input.netAmount,
      })
    ) {
      return { kind: "external-transfer-in", side: null };
    }
    return { kind: "internal-transfer", side: null };
  }

  if (type === "Dividend") return { kind: "dividend", side: null };
  if (type === "Fee") return { kind: "fee", side: null };
  if (type === "Grant") return { kind: "grant", side: null };
  if (type === "AdministrativePayment") return { kind: "fee-refund", side: null };
  if (type === "Tax") return { kind: "tax", side: null };
  if (type === "Interest") return { kind: "interest", side: null };
  if (type === "BonusPayment") return { kind: "bonus", side: null };
  if (type === "LegacyCorporateAction") return { kind: "corporate-action", side: null };
  return { kind: "other", side: null };
}

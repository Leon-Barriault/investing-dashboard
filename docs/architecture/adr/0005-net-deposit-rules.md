# ADR 0005 — What counts as a net deposit

## Status

Accepted

## Context

Wealthsimple records the same French phrase, "Transfert entrant d'argent", for cash moved between its own accounts and for an RRSP that arrived from another institution. Summing every money-movement row double-counts internal transfers. The classification below is what the synthetic sample's $3,970.00 net deposits are built from.

## Decision

Count these CAD amounts, with their sign:

- `EFT` greater than zero: deposit.
- `EFT` less than zero: withdrawal.
- `E_TRFIN`: deposit (Interac).
- `TRANSFER` greater than zero on an RRSP: external transfer in.

Do not count:

- `TRANSFER_TF`, `WDA_IN`, `WDA_OUT`, and every other `TRANSFER`.
- Grants, referral bonuses, fee refunds, dividends, interest, fees, and tax.

Those excluded rows stay in the cash activity table.

## Consequences

- On the synthetic sample, net deposits are $3,970.00: $1,570.00 of deposits (including Interac), a $100.00 withdrawal, and a $2,500.00 RRSP transfer-in.
- A future external transfer into a TFSA that uses subtype `TRANSFER` will be treated as internal until the rule is extended. That is backlog item "Transfer review", not a silent guess.
- The contribution chart uses the same set, accumulated by month and account.

# ADR 0004 — Positions are an estimated average cost

## Status

Accepted

## Context

The activity file has trades and swaps. It does not have a market price for each holding. A dashboard that showed a portfolio total without a price source would be making the number up.

Canadian tax lots use average cost (adjusted cost base). A simplified average cost is the closest reading of these rows. It is not a full ACB: there is no return of capital, and superficial losses are not deferred.

## Decision

- Replay buys, sells, corporate actions, and crypto swaps in date order.
- A buy's CAD cash out, which already includes commission, is the cost added.
- A sell removes average cost for the shares sold. The difference versus CAD proceeds is estimated realized gain.
- A name change on the same day moves cost from the outgoing quantity to the incoming quantity. Negatives are applied first so a same-symbol rename does not dilute the book.
- A crypto swap moves CAD cost from the coin sold to the coin bought. The USD notional on the swap row is not treated as Canadian dollars.
- Book value is the sum of open cost plus CAD cash as of the filter end date. The start date does not rewind the snapshot.
- The UI says "Estimate" and states that this is not a market value.
- If a known closed account still has quantity, the row warns that an in-kind close may be missing from the file. The quantity is not zeroed by hand.

## Consequences

- On the synthetic sample, PINE is 12 units at $300.00 cost, the RRSP cost is $200.00, cash is $3,592.25, the closed non-registered account is flat, and the closed crypto account still shows 0.5 NUT.
- A closed account can still show a quantity when the rows never record an in-kind transfer out. That is what the file supports.
- A later price file can multiply these quantities. Until then, no market total is displayed.

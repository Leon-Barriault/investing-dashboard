# Vision

Carnet is a notebook for a Wealthsimple activity export. It should answer, from the file in front of it, how money entered the accounts, what was traded, what dividends and fees did, and which estimated holdings the trades still imply.

The file is a cash and trade journal. It is not a statement of market value. Wealthsimple's own screen can show a balance this file cannot reproduce, because prices are not in the rows. Carnet refuses to invent that balance. It shows flows, and it labels rebuilt positions as estimates.

The public app opens on a synthetic sample so the repository can be public. A personal French export replaces that sample in the browser, without an account, a server, or a tracker.

## Outcome

Someone can open the app, see that the sample is invented, import their own export, slice the history by account, date, and symbol, and land on the matching trades from a chart.

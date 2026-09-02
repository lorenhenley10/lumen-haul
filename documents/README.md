# Quotes

## lumen-haul-quote-template.html

The master. Standard rates, no client data — every fillable field is still a
`[ bracketed placeholder ]`.

**Do not fill this one in.** Copy it into `quotes/` and fill in the copy:

```
mkdir -p quotes
cp lumen-haul-quote-template.html "quotes/client-name.html"
```

`quotes/` is **gitignored**. Filled quotes carry a client's name, their
contact details and negotiated pricing, and the PDFs beside them are build
output. The folder will not exist in a fresh clone, hence the `mkdir`.

Open the copy in a browser, click the bracketed fields to type, click the
packages you want, set the day counts, then Print → Save as PDF
(Letter, Margins: None).

Only edit the master when a **standing** rate or term changes — a new day
rate, a new package, revised terms. Then every future quote starts correct.

## Standard rates as of 2026-08-27

| Line | Rate |
|---|---|
| Director / DP (Loren Henley) | $1,000 / day |
| Sound Mixer | $850 / day |
| 1st Assistant Camera | $500 / day |
| ARRI Alexa Mini LF package | $1,500 / day |
| Blackmagic 6K FF indie package *(default)* | $200 / day |
| Triple-camera Blackmagic package | $250 / day |
| Lighting package *(default)* | $150 / day |
| Sound — Standard *(default)* | $100 / day |
| Sound — Expanded | $200 / day |
| Sound — Full production | $300 / day |

Default configuration — one day, crew of three, indie package, lighting,
standard sound — totals **$2,800**.

Rates live in exactly one place each: the `data-rate` attribute on the line.
Change the attribute *and* the printed rate beside it, and update the table
above.

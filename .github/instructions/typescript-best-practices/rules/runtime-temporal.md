---
title: Use Temporal for date and time logic
---

# Use Temporal for date and time logic

`Temporal` provides explicit types for plain dates, times, instants, and zoned date-times. It avoids many `Date` parsing, time zone, and calendar pitfalls and should replace new moment.js, date-fns, or luxon usage.

**Incorrect (uses legacy Date math):**
```ts
const birthday = new Date('1993-10-26')
const today = new Date()
const approximateAge = today.getFullYear() - birthday.getFullYear()
```

**Correct (uses date-domain type):**
```ts
const birthday = Temporal.PlainDate.from('1993-10-26')
const today = Temporal.Now.plainDateISO()
const age = today.since(birthday, { largestUnit: 'years' })
```

**Correct (uses zoned date-time type):**
```ts
const meeting = Temporal.ZonedDateTime.from('2026-06-15T09:00[America/New_York]')
const inLondon = meeting.withTimeZone('Europe/London')
```

Notes: Pick the `Temporal` type that matches the actual domain meaning: `PlainDate`, `PlainTime`, `PlainDateTime`, `ZonedDateTime`, `Instant`, `PlainYearMonth`, or `PlainMonthDay`. If runtime support is missing, use the official `Temporal` polyfill rather than adding a legacy date library for new code.

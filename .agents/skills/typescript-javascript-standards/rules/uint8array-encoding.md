---
name: uint8array-encoding
---

# Use Uint8Array helpers for byte encoding

Byte-oriented helpers on `Uint8Array` avoid the string-only constraints of `btoa()` and `atob()` and are safer for arbitrary binary data.

**Incorrect (treats bytes as strings):**
```ts
const binary = String.fromCharCode(...bytes)
const encoded = btoa(binary)
```

**Correct (uses byte-native helpers):**
```ts
const encoded = bytes.toBase64()
const hex = bytes.toHex()
const decoded = Uint8Array.fromBase64(encoded)
```

Notes: Prefer these helpers whenever the data is fundamentally bytes. If the runtime lacks them, use a binary-safe compatibility layer rather than string-based encoding tricks.

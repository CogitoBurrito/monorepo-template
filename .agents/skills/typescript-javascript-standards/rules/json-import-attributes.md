---
name: json-import-attributes
---

# Use import attributes for JSON modules

Native import attributes make JSON module loading explicit and let the loader enforce the expected type.

**Incorrect (loads JSON through runtime fetch):**
```ts
const translations = await fetch('./translations.json').then((response) => response.json())
```

**Correct (declares JSON module type):**
```ts
import translations from './translations.json' with { type: 'json' }
```

**Correct (uses attributes for dynamic import):**
```ts
const translations = await import('./translations.json', {
  with: { type: 'json' },
})
```

Notes: Use this for bundle-time or module-time JSON dependencies, not for runtime network fetches. If the bundler or runtime does not support import attributes yet, keep the compatible module-loading pattern and note the limitation.

---
title: Use Compound Components for Flexible Shared-State APIs
tags: advanced, compound-components, context, composition, api-design
---

## Use Compound Components for Flexible Shared-State APIs

For reusable UI primitives like accordions, tabs, menus, or dropdowns, prefer compound components over large config objects. The parent provides shared context and the children compose the final structure.

**Incorrect (rigid config-driven API):**

```tsx
<Accordion
  items={[
    { title: 'First', body: 'One' },
    { title: 'Second', body: 'Two' },
  ]}
/>
```

**Correct (composable API with shared parent state):**

```tsx
<Accordion>
  <Accordion.Item value="first">
    <Accordion.Header>First</Accordion.Header>
    <Accordion.Body>One</Accordion.Body>
  </Accordion.Item>
  <Accordion.Item value="second">
    <Accordion.Header>Second</Accordion.Header>
    <Accordion.Body>Two</Accordion.Body>
  </Accordion.Item>
</Accordion>
```

This pattern keeps the API flexible, lets consumers control markup, and still allows the parent to coordinate selection and accessibility behavior through context.

---
title: Use arrow functions for nested functions
---

# Use arrow functions for nested functions

Declare functions defined inside another function as arrow function expressions (`const fn = () => {}`), not `function` declarations. Nested arrow functions keep scopes concise, avoid `this` rebinding surprises, and read top-to-bottom like any other `const`.

**Incorrect (nested `function` declaration):**

```ts
function processItems(items: Item[]) {
  function sortByDate(a: Item, b: Item) {
    return a.date.getTime() - b.date.getTime();
  }

  return items.sort(sortByDate);
}
```

**Correct (arrow function expression):**

```ts
function processItems(items: Item[]) {
  const sortByDate = (a: Item, b: Item) => a.date.getTime() - b.date.getTime();

  return items.sort(sortByDate);
}
```

**React (incorrect — `function` declarations inside a component):**

```tsx
function TodoList({ todos }: TodoListProps) {
  function handleToggle(id: string) {
    setDone((prev) =>
      prev.includes(id) ?
        prev.filter((doneId) => doneId !== id)
      : [...prev, id],
    );
  }

  return (
    <ul>
      {todos.map(function (todo) {
        return (
          <li key={todo.id}>
            <button onClick={() => handleToggle(todo.id)}>{todo.title}</button>
          </li>
        );
      })}
    </ul>
  );
}
```

**React (correct — arrow function expressions):**

```tsx
function TodoList({ todos }: TodoListProps) {
  const handleToggle = (id: string) => {
    setDone((prev) =>
      prev.includes(id) ?
        prev.filter((doneId) => doneId !== id)
      : [...prev, id],
    );
  };

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <button onClick={() => handleToggle(todo.id)}>{todo.title}</button>
        </li>
      ))}
    </ul>
  );
}
```

In React this matters even more: a nested `function` declaration inside a component creates a new identity on every render, and hoisting makes the code harder to read. Arrow functions assigned to `const` — or inlined in JSX — keep event handlers and render callbacks concise, predictable, and top-to-bottom.

A nested `function` declaration is hoisted within its enclosing function, which can mask declaration-order bugs and lets code be used before it is defined. Arrow functions are block-scoped like any other `const`, so definition order is explicit and the code reads top-to-bottom.

**Enforce automatically** with `no-restricted-syntax`:

```js
'no-restricted-syntax': [
  'error',
  {
    selector: 'FunctionDeclaration FunctionDeclaration',
    message:
      'Nested functions must be declared as arrow function expressions (e.g., `const fn = () => {}`).',
  },
]
```

Use arrow functions for all nested function definitions. Top-level or exported `function` declarations are still fine.

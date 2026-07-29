---
title: Use useReducer for Related State
tags: rerender, state, useReducer, state-machine, consistency
---

## Use useReducer for Related State

When multiple pieces of state must change together, prefer `useReducer` over several loosely coordinated `useState` calls. This prevents impossible combinations like "loading and loaded" or "error and success" at the same time.

**Incorrect (separate state can drift out of sync):**

```tsx
function PostView() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [post, setPost] = useState<Post | null>(null)

  async function loadPost(id: string) {
    setIsLoading(true)
    setError(null)

    try {
      const nextPost = await fetchPost(id)
      setPost(nextPost)
    } catch (error) {
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }
}
```

**Correct (one transition updates the whole state shape):**

```tsx
type State =
  | { status: 'idle'; post: null; error: null }
  | { status: 'loading'; post: null; error: null }
  | { status: 'success'; post: Post; error: null }
  | { status: 'failure'; post: null; error: Error }

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Post }
  | { type: 'FETCH_FAILURE'; payload: Error }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { status: 'loading', post: null, error: null }
    case 'FETCH_SUCCESS':
      return { status: 'success', post: action.payload, error: null }
    case 'FETCH_FAILURE':
      return { status: 'failure', post: null, error: action.payload }
  }
}
```

Use `useReducer` when one change logically requires updating multiple fields together.

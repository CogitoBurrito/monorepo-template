---
title: Split Data and Presentation by Reason to Change
---

## Split Data and Presentation by Reason to Change

A component should change for one reason. If it fetches data, handles loading and errors, and also renders layout, it has multiple responsibilities. Split the data logic into a hook or container and keep the presentational component focused on rendering.

**Incorrect (data, error handling, and rendering coupled together):**

```tsx
function ProductCard({ productId }: { productId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
  });

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;
  if (!data) return null;

  return <Card title={data.name} price={data.price} />;
}
```

**Correct (separate hook/container from presentation):**

```tsx
function useProduct(productId: string) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
  });
}

function ProductCardContainer({ productId }: { productId: string }) {
  const { data, isLoading, error } = useProduct(productId);

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorMessage />;

  return <ProductCardView product={data} />;
}

function ProductCardView({ product }: { product: Product }) {
  return <Card title={product.name} price={product.price} />;
}
```

This keeps API changes localized to the hook or container and layout changes localized to the view.

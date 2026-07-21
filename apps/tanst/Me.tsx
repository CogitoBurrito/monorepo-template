interface MyComponentProps {
  count: number;
}

function MyComponent({ count }: MyComponentProps) {
  return <div>{count && <span>There are {count} results</span>}</div>;
  //           ^^^ Potential leaked value 'count' that might cause unintentionally rendered values or rendering crashes.
}

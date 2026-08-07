import { useState } from "react";

type CounterProps = {
  /**
  Initial count value. Defaults to 0.
  */
  initialCount?: number;
  /**
  Label displayed above the counter.
  */
  label?: string;
  /**
  Maximum allowed count.
  */
  max?: number;
  /**
  Minimum allowed count.
  */
  min?: number;
};

function Counter({
  initialCount = 0,
  label = "Counter",
  max = Infinity,
  min = -Infinity,
}: CounterProps) {
  const [count, setCount] = useState(initialCount);

  const canDecrement = count > min;
  const canIncrement = count < max;
  const isModified = count !== initialCount;

  const handleDecrement = () => {
    setCount((previous) => Math.max(previous - 1, min));
  };

  const handleIncrement = () => {
    setCount((previous) => Math.min(previous + 1, max));
  };

  const handleReset = () => {
    setCount(initialCount);
  };

  return (
    <div className="counter">
      <span className="counter__label">{label}</span>
      <div className="counter__controls">
        <button
          aria-label="Decrement"
          disabled={!canDecrement}
          onClick={handleDecrement}
          type="button"
        >
          −
        </button>
        <span aria-live="polite" className="counter__value">
          {count}
        </span>
        <button
          aria-label="Increment"
          disabled={!canIncrement}
          onClick={handleIncrement}
          type="button"
        >
          +
        </button>
      </div>
      <button className="counter__reset" onClick={handleReset} type="button">
        Reset
      </button>
      {isModified ?
        <p className="counter__changed">Value has been modified</p>
      : null}
    </div>
  );
}

export type { CounterProps };
export default Counter;

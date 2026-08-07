import { useEffect, useRef, useState } from "react";

type StopwatchProps = {
  /** Label displayed above the stopwatch. Defaults to "Stopwatch". */
  label?: string;
};

function formatElapsedTime(totalMs: number): string {
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((totalMs % 1000) / 10);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function Stopwatch({ label = "Stopwatch" }: StopwatchProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const elapsedAtStartRef = useRef(0);
  const startedAtRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      setElapsedMs(
        elapsedAtStartRef.current +
          performance.now() -
          (startedAtRef.current ?? 0),
      );
    }, 10);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);

  const canReset = isRunning || elapsedMs > 0;

  const handleStart = () => {
    startedAtRef.current = performance.now();
    elapsedAtStartRef.current = elapsedMs;
    setIsRunning(true);
  };

  const handleStop = () => {
    setElapsedMs(
      elapsedAtStartRef.current +
        performance.now() -
        (startedAtRef.current ?? 0),
    );
    setIsRunning(false);
  };

  const handleReset = () => {
    setElapsedMs(0);
    setIsRunning(false);
    elapsedAtStartRef.current = 0;
    startedAtRef.current = undefined;
  };

  return (
    <div className="stopwatch">
      <span className="stopwatch__label">{label}</span>
      <span aria-live="polite" className="stopwatch__time">
        {formatElapsedTime(elapsedMs)}
      </span>
      <div className="stopwatch__controls">
        <button
          aria-label={isRunning ? "Stop" : "Start"}
          onClick={isRunning ? handleStop : handleStart}
          type="button"
        >
          {isRunning ? "Stop" : "Start"}
        </button>
        <button
          aria-label="Reset"
          disabled={!canReset}
          onClick={handleReset}
          type="button"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export type { StopwatchProps };
export default Stopwatch;

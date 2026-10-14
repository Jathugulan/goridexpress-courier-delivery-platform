"use client";

import * as React from "react";

/**
 * Live-region announcer for screen readers.
 * Used for payment results, delivery status changes, and other async
 * events that must be communicated without a visual refresh.
 */
export function useAnnouncer() {
  const [message, setMessage] = React.useState("");
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  const announce = React.useCallback((text: string, assertive = false) => {
    setMessage("");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(text), 60);
    void assertive;
  }, []);

  const region = (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      key={message}
    >
      {message}
    </div>
  );

  return { announce, region };
}

/** Renders a persistent polite live region for a dynamic status string. */
export function LiveRegion({ message, assertive }: { message: string; assertive?: boolean }) {
  return (
    <div
      role="status"
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

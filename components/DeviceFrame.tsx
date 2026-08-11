import type { ReactNode } from "react";

/**
 * The designs are authored at exactly 360 x 800.
 *
 * On a real phone we render edge to edge so it reads as the actual SOLV app.
 * From 480px up there is room to spare, so the same 360 x 800 app is dropped
 * into a phone mockup instead of being stretched — stretching would break
 * every fixed dimension taken from Figma.
 *
 * `.device-screen` is the positioning context for the whole app: screens pin
 * their app bar and bottom bar to it and scroll their own content.
 */
export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="device-page">
      <div className="device-bezel">
        <div className="device-screen">{children}</div>
      </div>
    </div>
  );
}

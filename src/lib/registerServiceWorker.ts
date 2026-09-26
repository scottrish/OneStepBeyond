import { setUpdateReady } from "./pwaUpdateStore";

type RegisterSW = (options: {
  onNeedRefresh?: () => void;
}) => (reloadPage?: boolean) => Promise<void>;

// Registers the service worker (PWA phase 2, 2a) — in production builds
// only, so development and tests never run one and a stale cache can
// never hide a change. When a new version is waiting, Home offers to
// refresh (pwaUpdateStore).
export async function registerServiceWorker(
  isProduction: boolean,
  load: () => Promise<{ registerSW: RegisterSW }> = () => import("virtual:pwa-register"),
): Promise<void> {
  if (!isProduction || !("serviceWorker" in navigator)) return;
  const { registerSW } = await load();
  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      setUpdateReady(() => void updateServiceWorker(true));
    },
  });
}

let securityInitialized = false;

/**
 * Initializes client-side production tamper deterrents.
 * Runs exclusively in production builds (import.meta.env.PROD).
 */
export function initProductionSecurity(): void {
  if (!import.meta.env.PROD || typeof window === 'undefined' || securityInitialized) {
    return;
  }
  securityInitialized = true;

  // 1. Silence browser console methods in production so debug data is never exposed
  const noop = () => {};
  const silencedMethods: (keyof Console)[] = [
    'log',
    'warn',
    'info',
    'debug',
    'table',
  ];

  for (const method of silencedMethods) {
    try {
      Object.defineProperty(window.console, method, {
        value: noop,
        writable: false,
        configurable: false,
      });
    } catch {
      try {
        (window.console as unknown as Record<string, unknown>)[method] = noop;
      } catch {
        // Ignore locked console environments
      }
    }
  }

  // 2. Disable context menu on sensitive app views (preserving standard input/textarea paste UX)
  const handleContextMenu = (event: MouseEvent) => {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    ) {
      return;
    }
    event.preventDefault();
  };

  // 3. Block common DevTools & view-source keyboard shortcuts in production
  const handleKeyDown = (event: KeyboardEvent) => {
    const key = (event.key || '').toLowerCase();

    // F12
    if (event.key === 'F12' || event.keyCode === 123) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I / J / C (Windows/Linux)
    if (
      event.ctrlKey &&
      event.shiftKey &&
      (key === 'i' || key === 'j' || key === 'c')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    // Ctrl+U (View Source)
    if (event.ctrlKey && !event.shiftKey && !event.altKey && key === 'u') {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    // Cmd+Option+I / J / C / U (macOS)
    if (
      event.metaKey &&
      event.altKey &&
      (key === 'i' || key === 'j' || key === 'c' || key === 'u')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    return undefined;
  };

  document.addEventListener('contextmenu', handleContextMenu, {capture: true});
  window.addEventListener('keydown', handleKeyDown, {capture: true});
}

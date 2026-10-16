export async function requestNotificationAccess(browser = globalThis) {
  if (browser.isSecureContext === false || !browser.Notification?.requestPermission) return 'unsupported';
  const current = browser.Notification.permission;
  if (current === 'granted' || current === 'denied') return current;
  const key = 'notification-permission-requested';
  try {
    if (browser.sessionStorage?.getItem(key)) return 'default';
    browser.sessionStorage?.setItem(key, 'true');
  } catch { /* Storage may be blocked. The browser remains authoritative. */ }
  try { return await browser.Notification.requestPermission(); }
  catch { return 'unsupported'; }
}

const KEY = 'riskguard_session';
export function getSession() {
    try {
        const session = JSON.parse(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || 'null');
        return session?.token && new Date(session.expiresAt).getTime() > Date.now() ? session : null;
    } catch { return null; }
}
export function saveSession(session, remember = false) {
    clearSession();
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
}
export function clearSession() {
    for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem(KEY);
        storage.removeItem('lankaguard_user');
        storage.removeItem('fraudguard_user');
    }
}

// Existing Render timestamps without an offset were stored as UTC.
// Always display the bank's business timezone, regardless of the browser timezone.
export const DISPLAY_TIME_ZONE = 'Asia/Colombo';
export const TIME_ZONE_LABEL = 'Sri Lanka time (UTC+05:30)';

export function parseTimestamp(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    if (typeof value !== 'string' || !value.trim()) return null;
    let timestamp = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(timestamp)) return null;
    // Java LocalDateTime can contain up to nine fractional digits; JS uses milliseconds.
    timestamp = timestamp.replace(/(\.\d{3})\d+/, '$1');
    if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp)) timestamp += 'Z';
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function timestampMillis(value) { return parseTimestamp(value)?.getTime() ?? 0; }
export function formatTime(value, options = {}) {
    const date = parseTimestamp(value);
    return date ? date.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit', second: '2-digit', ...options, timeZone: DISPLAY_TIME_ZONE }) : 'Unavailable';
}
export function formatDate(value, options = {}) {
    const date = parseTimestamp(value);
    return date ? date.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric', ...options, timeZone: DISPLAY_TIME_ZONE }) : 'Unavailable';
}
export function formatDateTime(value) {
    return parseTimestamp(value) ? `${formatDate(value)} • ${formatTime(value)}` : 'Unavailable';
}
export function dateKey(value = new Date()) {
    const date = parseTimestamp(value);
    if (!date) return '';
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: DISPLAY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const part = type => parts.find(item => item.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTimestamp, timestampMillis, formatTime, formatDateTime, dateKey } from './time.js';

test('legacy UTC, explicit Z and offset timestamps represent the same instant', () => {
    const expected = Date.parse('2026-10-28T12:00:00Z');
    for (const value of ['2026-10-28T12:00:00', '2026-10-28T12:00:00Z', '2026-10-28T17:30:00+05:30']) {
        assert.equal(timestampMillis(value), expected);
        assert.match(formatTime(value, { hour12: false }), /17:30:00/);
    }
});
test('Sri Lankan dates roll over at 18:30 UTC, independently of browser timezone', () => {
    assert.equal(dateKey('2026-10-28T18:29:59Z'), '2026-10-28');
    assert.equal(dateKey('2026-10-28T18:30:00Z'), '2026-10-29');
    assert.match(formatDateTime('2026-10-28T18:30:00'), /29/);
});
test('nanoseconds are safely trimmed and invalid/missing timestamps are not invented', () => {
    assert.equal(parseTimestamp('2026-10-28T12:00:00.123456789').toISOString(), '2026-10-28T12:00:00.123Z');
    for (const value of [null, undefined, '', 'not-a-date']) {
        assert.equal(parseTimestamp(value), null);
        assert.equal(formatDateTime(value), 'Unavailable');
    }
});

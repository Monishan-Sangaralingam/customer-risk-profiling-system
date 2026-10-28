import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAlerts } from './alerts.js';
const settings = { showHighRisk: true, showMediumRisk: true, showDeclined: true };
const score = { customerId: 9, score: 87, category: 'High' };

test('saved resolution survives reload and reopens when the risk changes', () => {
    const saved = [{ id: 'risk-high-9', status: 'Resolved', eventKey: '87' }];
    assert.equal(buildAlerts([score], [], settings, saved)[0].status, 'Resolved');
    assert.equal(buildAlerts([{ ...score, score: 90 }], [], settings, saved)[0].status, 'New');
});
test('saved alert preferences control visible alerts', () => {
    assert.deepEqual(buildAlerts([score], [], { ...settings, showHighRisk: false }, []), []);
});
test('declined transactions use the persisted score without inventing a risk value', () => {
    const tx = { transactionId: 1, customerId: 9, transactionStatus: 'DECLINED', riskScore: 72 };
    assert.equal(buildAlerts([score], [tx], settings, []).find(a => a.id === 'tx-dec-1').riskScore, 72);
    assert.equal(buildAlerts([], [{ ...tx, riskScore: null }], settings, [])[0].riskScore, null);
});

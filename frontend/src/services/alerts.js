// Stable event keys keep resolutions across reloads and reopen changed risk events.
export function buildAlerts(scores, transactions, settings, savedStatuses) {
    const saved = new Map(savedStatuses.map(item => [item.id, item]));
    const scoreByCustomer = new Map(scores.map(score => [score.customerId, score]));
    const alerts = [];
    for (const score of scores) {
        const band = (score.category || '').toLowerCase();
        if (!((band === 'high' && settings.showHighRisk) || (band === 'medium' && settings.showMediumRisk))) continue;
        const high = band === 'high';
        alerts.push({ id: `risk-${high ? 'high' : 'med'}-${score.customerId}`, eventKey: `${score.score}`, customerId: score.customerId, riskScore: score.score, title: `${high ? 'High' : 'Medium'} risk profile (Score: ${score.score}/100)`, desc: 'Review this customer’s behavioral profile and transaction history.', priority: high ? 'Critical' : 'Medium', tags: [score.category], time: score.updatedAt ? new Date(score.updatedAt).toLocaleString() : 'Recent', status: 'New' });
    }
    if (settings.showDeclined) for (const tx of transactions.filter(item => item.transactionStatus === 'DECLINED')) {
        alerts.push({ id: `tx-dec-${tx.transactionId}`, eventKey: `${tx.transactionId}`, customerId: tx.customerId, riskScore: tx.riskScore ?? scoreByCustomer.get(tx.customerId)?.score ?? null, title: `Transaction declined: #${tx.transactionId}`, desc: tx.declineReason || 'Review the declined transaction.', priority: 'High', tags: [tx.channel || 'Transaction', 'Declined'], time: tx.transactionDatetime ? new Date(tx.transactionDatetime).toLocaleString() : 'Recent', status: 'Investigating' });
    }
    return alerts.map(alert => ({ ...alert, customer: `Customer #${alert.customerId}`, status: saved.get(alert.id)?.eventKey === alert.eventKey ? saved.get(alert.id).status : alert.status }));
}

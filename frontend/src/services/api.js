// Central API service for Customer Risk Profiling System
const API_BASE = '/api';
const transactionOrigin = (import.meta.env.VITE_TRANSACTION_SERVICE_URL || '').replace(/\/+$/, '');
const riskOrigin = (import.meta.env.VITE_RISK_SERVICE_URL || '').replace(/\/+$/, '');

function serviceOrigin(endpoint) {
    return endpoint === '/risk' || endpoint.startsWith('/risk/') ? riskOrigin : transactionOrigin;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchJson(endpoint, options = {}) {
    const url = `${serviceOrigin(endpoint)}${API_BASE}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {}),
            },
        });

        if (!response.ok) {
            let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errBody = await response.json();
                if (errBody.message) errorMsg = errBody.message;
            } catch {
                // Ignore json parse error for non-json responses
            }
            throw new Error(errorMsg);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return await response.text();
    } catch (err) {
        console.error(`API Error [${endpoint}]:`, err);
        throw err;
    }
}

export const api = {
    // ---------------------------------------------------------------------------
    // Risk Score Service Endpoints
    // ---------------------------------------------------------------------------
    async getAllRiskScores() {
        return await fetchJson('/risk');
    },

    async getCustomerRisk(customerId) {
        return await fetchJson(`/risk/${customerId}`);
    },

    async getCustomerRiskHistory(customerId) {
        return await fetchJson(`/risk/${customerId}/history`);
    },

    async calculateRisk(customerId, trigger = 'MANUAL') {
        return await fetchJson(`/risk/calculate/${customerId}?trigger=${encodeURIComponent(trigger)}`);
    },

    // ---------------------------------------------------------------------------
    // Transaction Service Endpoints
    // ---------------------------------------------------------------------------
    async getAllTransactions() {
        return await fetchJson('/transactions');
    },

    async getTransactionById(transactionId) {
        return await fetchJson(`/transactions/${transactionId}`);
    },

    async getCustomerTransactions(customerId) {
        return await fetchJson(`/transactions/customer/${customerId}`);
    },

    async getApprovedCustomerTransactions(customerId) {
        return await fetchJson(`/transactions/customer/${customerId}/approved`);
    },

    async createTransaction(transactionData) {
        return await fetchJson('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData),
        });
    },

    async updateTransactionStatus(transactionId, status, reason = '') {
        const url = `/transactions/${transactionId}/status?status=${encodeURIComponent(status)}&reason=${encodeURIComponent(reason)}`;
        return await fetchJson(url, {
            method: 'PUT',
        });
    },

    // ---------------------------------------------------------------------------
    // Behavioral Feature Endpoints
    // ---------------------------------------------------------------------------
    async getCustomerFeatures(customerId) {
        return await fetchJson(`/features/${customerId}`);
    },

    // ---------------------------------------------------------------------------
    // System Health Checks
    // ---------------------------------------------------------------------------
    async getGatewayHealth() {
        try {
            // Render calls the services directly; local development uses the gateway.
            const origins = [...new Set([transactionOrigin, riskOrigin])];
            const results = await Promise.all(origins.map(async origin => {
                const res = await fetch(`${origin}/actuator/health`);
                if (!res.ok) throw new Error('Service health check failed');
                return res.json();
            }));
            return { status: results.every(result => result.status === 'UP') ? 'UP' : 'DOWN' };
        } catch {
            return { status: 'DOWN' };
        }
    },
};

export default api;

import { getSession, clearSession } from './session';
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
    const token = getSession()?.token;
    if (token) defaultHeaders.Authorization = `Bearer ${token}`;

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
                if (errBody.message || errBody.detail) errorMsg = errBody.message || errBody.detail;
            } catch {
                // Ignore json parse error for non-json responses
            }
            if (response.status === 401 && !['/auth/login', '/auth/register'].includes(endpoint)) {
                clearSession();
                window.location.assign('/login');
            }
            throw new Error(errorMsg);
        }

        if (response.status === 204) return null;

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
    login: (email, password) => fetchJson('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (name, email, password) => fetchJson('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    getProfile: () => fetchJson('/auth/me'),
    logout: () => fetchJson('/auth/logout', { method: 'POST' }),
    changePassword: (currentPassword, newPassword) => fetchJson('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
    getSettings: () => fetchJson('/settings'),
    saveSettings: settings => fetchJson('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
    getAlertStatuses: () => fetchJson('/alert-status'),
    updateAlertStatus: (id, status, eventKey) => fetchJson(`/alert-status/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ status, eventKey }) }),
    getModelStatus: () => fetchJson('/risk/system/status'),
    getSystemInfo: () => fetchJson('/system/info'),
    serviceUrls: { transactions: transactionOrigin || window.location.origin, risk: riskOrigin || window.location.origin },
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
        const services = await Promise.all([
            ['Transaction service', transactionOrigin], ['Risk score service', riskOrigin],
        ].map(async ([name, origin]) => {
            try {
                const response = await fetch(`${origin}/actuator/health`, { signal: AbortSignal.timeout(15000) });
                const result = await response.json();
                return { name, status: response.ok && result.status === 'UP' ? 'UP' : 'DOWN' };
            } catch { return { name, status: 'DOWN' }; }
        }));
        return { status: services.every(service => service.status === 'UP') ? 'UP' : 'DOWN', services };
    },
};

export default api;

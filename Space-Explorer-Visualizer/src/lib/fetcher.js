/**
 * src/lib/fetcher.js
 * Enterprise Fetch Client: Retries, Exponential Backoff Jitter, Idempotency & Global Error Interceptors
 */

function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Show a toast notification via custom event
 */
function showToast(message, type = 'error') {
    window.dispatchEvent(new CustomEvent('ui:toast', {
        detail: { message, type },
    }));
}

export class FetchError extends Error {
    constructor(status, statusText, data, message) {
        super(message || `HTTP ${status}: ${statusText}`);
        this.name = 'FetchError';
        this.status = status;
        this.statusText = statusText;
        this.data = data;
    }
}

/**
 * Resilient fetch wrapper with retries, timeouts, idempotency, and global error handling.
 * @param {string} url
 * @param {Object} options - Extended RequestInit with timeoutMs, retries, retryDelayMs, idempotencyKey, skipAuth
 * @returns {Promise<any>}
 */
export async function resilientFetch(url, options = {}) {
    const {
        timeoutMs = 8000,
        retries = 3,
        retryDelayMs = 1000,
        idempotencyKey,
        skipAuth = false,
        headers: customHeaders = {},
        ...restOptions
    } = options;

    const headers = new Headers(customHeaders);

    // Attach JWT if available
    if (!skipAuth) {
        const token = localStorage.getItem('spaceToken');
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    // Attach idempotency key for mutating requests
    const method = (restOptions.method || 'GET').toUpperCase();
    const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    if (isMutating) {
        headers.set('X-Idempotency-Key', idempotencyKey || generateUUID());
    }

    headers.set('Accept', 'application/json');
    if (restOptions.body && typeof restOptions.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    let attempt = 0;

    while (attempt <= retries) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...restOptions,
                headers,
                signal: controller.signal,
            });

            clearTimeout(timer);

            // 401 — auto-logout
            if (response.status === 401) {
                localStorage.removeItem('spaceToken');
                localStorage.removeItem('spaceUserName');
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
                if (window.location.pathname !== '/') {
                    window.location.href = `/?returnUrl=${encodeURIComponent(window.location.pathname)}`;
                }
                throw new FetchError(401, 'Unauthorized', null, 'Session expired. Redirecting to login.');
            }

            // 403 — forbidden
            if (response.status === 403) {
                showToast('Access denied for this resource.', 'error');
                throw new FetchError(403, 'Forbidden', null, 'Access denied.');
            }

            // 5xx — retry candidate
            if (response.status >= 500 && attempt < retries) {
                throw new FetchError(response.status, response.statusText, null, 'Server error — retrying.');
            }

            if (!response.ok) {
                let errorData = null;
                try { errorData = await response.json(); } catch { errorData = await response.text(); }
                throw new FetchError(response.status, response.statusText, errorData);
            }

            // 204 No Content
            if (response.status === 204) return null;
            return await response.json();

        } catch (err) {
            clearTimeout(timer);

            const isAbort = err.name === 'AbortError';
            const isRetryable = isAbort || err instanceof TypeError || (err instanceof FetchError && err.status >= 500);

            attempt++;

            if (attempt > retries || !isRetryable) {
                const msg = isAbort
                    ? `Request timed out (${timeoutMs}ms): ${url}`
                    : err.message || 'Network error';
                showToast(msg, 'error');
                throw err;
            }

            // Exponential backoff with jitter
            const jitter = Math.random() * 200;
            const delay = retryDelayMs * Math.pow(2, attempt - 1) + jitter;
            await sleep(delay);
        }
    }

    throw new Error('Exceeded maximum retry attempts.');
}

export default resilientFetch;

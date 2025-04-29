/**
 * API Client for AvatarCommerce
 * Handles all API requests with common error handling and authentication
 */

/**
 * Class for making API requests
 */
class ApiClient {
    /**
     * Create a new api client instance
     */
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
        this.retryAttempts = CONFIG.API.RETRY_ATTEMPTS;
    }

    /**
     * Get the auth token from localStorage
     * @returns {string|null} The auth token or null if not available
     */
    getToken() {
        return localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
    }

    /**
     * Get headers for API requests
     * @param {boolean} withAuth - Whether to include auth token
     * @param {string} contentType - Content type header value
     * @returns {Object} Headers object
     */
    getHeaders(withAuth = true, contentType = 'application/json') {
        const headers = {};
        
        // Add content type if specified
        if (contentType) {
            headers['Content-Type'] = contentType;
        }
        
        // Add auth token if available and requested
        if (withAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        
        return headers;
    }

    /**
     * Make a GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - URL parameters
     * @param {boolean} withAuth - Whether to include auth token
     * @returns {Promise} Promise that resolves with the response data
     */
    async get(endpoint, params = {}, withAuth = true) {
        // Construct URL with query parameters
        let url = `${this.baseUrl}${endpoint}`;
        
        if (Object.keys(params).length > 0) {
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value);
                }
            });
            url += `?${queryParams.toString()}`;
        }
        
        return this.request(url, {
            method: 'GET',
            headers: this.getHeaders(withAuth)
        });
    }

    /**
     * Make a POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {boolean} withAuth - Whether to include auth token
     * @returns {Promise} Promise that resolves with the response data
     */
    async post(endpoint, data = {}, withAuth = true) {
        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(withAuth),
            body: JSON.stringify(data)
        });
    }

    /**
     * Make a POST request with FormData
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - Form data
     * @param {boolean} withAuth - Whether to include auth token
     * @returns {Promise} Promise that resolves with the response data
     */
    async postFormData(endpoint, formData, withAuth = true) {
        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(withAuth, null), // No content type for FormData
            body: formData
        });
    }

    /**
     * Make a PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {boolean} withAuth - Whether to include auth token
     * @returns {Promise} Promise that resolves with the response data
     */
    async put(endpoint, data = {}, withAuth = true) {
        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(withAuth),
            body: JSON.stringify(data)
        });
    }

    /**
     * Make a DELETE request
     * @param {string} endpoint - API endpoint
     * @param {boolean} withAuth - Whether to include auth token
     * @returns {Promise} Promise that resolves with the response data
     */
    async delete(endpoint, withAuth = true) {
        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders(withAuth)
        });
    }

    /**
     * Make an API request with retry logic and error handling
     * @param {string} url - Full URL
     * @param {Object} options - Fetch options
     * @returns {Promise} Promise that resolves with the response data
     */
    async request(url, options) {
        let attempts = 0;
        let error;
        
        // Add timeout to fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        options.signal = controller.signal;
        
        // Attempt the request with retries
        while (attempts < this.retryAttempts + 1) {
            try {
                const response = await fetch(url, options);
                
                // Clear timeout
                clearTimeout(timeoutId);
                
                // Handle unauthorized error (401)
                if (response.status === 401) {
                    this.handleUnauthorized();
                    throw new Error('Unauthorized');
                }
                
                // Parse JSON response
                const data = await response.json();
                
                // Check for API error response
                if (!response.ok) {
                    throw new Error(data.message || 'API request failed');
                }
                
                return data;
            } catch (err) {
                error = err;
                attempts++;
                
                // Don't retry on abort or auth errors
                if (err.name === 'AbortError' || err.message === 'Unauthorized') {
                    break;
                }
                
                // Wait before retry (exponential backoff)
                if (attempts < this.retryAttempts + 1) {
                    const delay = Math.pow(2, attempts) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // All attempts failed
        throw error;
    }

    /**
     * Handle unauthorized error (expired token, etc.)
     */
    handleUnauthorized() {
        // Clear auth data
        localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
        localStorage.removeItem(CONFIG.AUTH.USER_KEY);
        
        // Redirect to login page
        if (window.location.pathname !== '/pages/auth/login.html') {
            window.location.href = '/pages/auth/login.html';
        }
    }
}

// Create and export a singleton instance
const API = new ApiClient();
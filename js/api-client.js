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
     * Get headers for API requests with enhanced CORS support
     * @param {boolean} withAuth - Whether to include auth token
     * @param {string} contentType - Content type header value
     * @returns {Object} Headers object
     */
    getHeaders(withAuth = true, contentType = 'application/json') {
        const headers = {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
        };
        
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
     * Make a GET request with enhanced error handling
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
            headers: this.getHeaders(withAuth),
            mode: 'cors', // Enable CORS
            credentials: 'omit' // Don't send cookies
        });
    }

    /**
     * Make a POST request with enhanced error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {boolean} withAuth - Whether to include auth token
     * @returns {Promise} Promise that resolves with the response data
     */
    async post(endpoint, data = {}, withAuth = true) {
        return this.request(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(withAuth),
            body: JSON.stringify(data),
            mode: 'cors',
            credentials: 'omit'
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
            body: formData,
            mode: 'cors',
            credentials: 'omit'
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
            body: JSON.stringify(data),
            mode: 'cors',
            credentials: 'omit'
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
            headers: this.getHeaders(withAuth),
            mode: 'cors',
            credentials: 'omit'
        });
    }

    /**
     * Make an API request with retry logic and enhanced error handling
     * @param {string} url - Full URL
     * @param {Object} options - Fetch options
     * @returns {Promise} Promise that resolves with the response data
     */
    async request(url, options) {
        let attempts = 0;
        let error;
        
        console.log(`🚀 Making API request to: ${url}`);
        console.log(`📋 Request options:`, options);
        
        // Add timeout to fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        options.signal = controller.signal;
        
        // Attempt the request with retries
        while (attempts < this.retryAttempts + 1) {
            try {
                console.log(`🔄 Attempt ${attempts + 1}/${this.retryAttempts + 1}`);
                
                const response = await fetch(url, options);
                
                // Clear timeout
                clearTimeout(timeoutId);
                
                console.log(`📥 Response status: ${response.status}`);
                console.log(`📥 Response headers:`, response.headers);
                
                // Handle different response statuses
                if (response.status === 0) {
                    throw new Error('Network error - please check your connection and server status');
                }
                
                // Handle unauthorized error (401)
                if (response.status === 401) {
                    this.handleUnauthorized();
                    throw new Error('Unauthorized - please login again');
                }
                
                // Handle server errors
                if (response.status >= 500) {
                    throw new Error(`Server error (${response.status}) - please try again later`);
                }
                
                // Try to parse response
                let data;
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    try {
                        data = await response.json();
                    } catch (parseError) {
                        console.error('Failed to parse JSON response:', parseError);
                        throw new Error('Invalid response format from server');
                    }
                } else {
                    // Handle non-JSON responses
                    data = { message: await response.text() };
                }
                
                // Check for API error response
                if (!response.ok) {
                    const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
                    throw new Error(errorMessage);
                }
                
                console.log(`✅ Request successful:`, data);
                return data;
                
            } catch (err) {
                error = err;
                attempts++;
                
                console.error(`❌ Request failed (attempt ${attempts}):`, err);
                
                // Don't retry on abort, auth errors, or client errors
                if (err.name === 'AbortError') {
                    throw new Error('Request timed out - please check your internet connection');
                }
                
                if (err.message.includes('Unauthorized') || err.message.includes('401')) {
                    break;
                }
                
                // Don't retry on network errors that suggest server is unreachable
                if (err.message.includes('Network error') || err.message.includes('Failed to fetch')) {
                    throw new Error('Cannot connect to server - please check if the server is running and accessible');
                }
                
                // Wait before retry (exponential backoff)
                if (attempts < this.retryAttempts + 1) {
                    const delay = Math.pow(2, attempts) * 1000;
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // All attempts failed
        console.error(`💥 All ${this.retryAttempts + 1} attempts failed`);
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
        if (window.location.pathname !== '/pages/login.html') {
            window.location.href = '/pages/login.html';
        }
    }

    /**
     * Test API connectivity
     * @returns {Promise<boolean>} True if API is accessible
     */
    async testConnection() {
        try {
            console.log('🔍 Testing API connection...');
            
            // Try a simple GET request to a public endpoint
            const response = await fetch(`${this.baseUrl.replace('/api', '')}/api/debug/db-test`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log(`🔍 Connection test result: ${response.status}`);
            return response.status < 500; // Accept any response that isn't a server error
            
        } catch (error) {
            console.error('🔍 Connection test failed:', error);
            return false;
        }
    }
}

// Create and export a singleton instance
const API = new ApiClient();

// Test connection on page load
document.addEventListener('DOMContentLoaded', async () => {
    const isConnected = await API.testConnection();
    if (!isConnected) {
        console.warn('⚠️ Warning: Cannot connect to API server');
        
        // Show user-friendly error message
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
        `;
        alertDiv.innerHTML = `
            <strong>Connection Error</strong><br>
            Cannot connect to server. Please check your configuration.
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer;">×</button>
        `;
        document.body.appendChild(alertDiv);
    }
});
/**
 * Utility functions for AvatarCommerce
 */

const UTILS = {
    /**
     * Authentication utilities
     */
    auth: {
        /**
         * Get current user data
         * @returns {Object|null} User data or null if not logged in
         */
        getCurrentUser: () => {
            const userStr = localStorage.getItem(CONFIG.AUTH.USER_KEY);
            return userStr ? JSON.parse(userStr) : null;
        },
        
        /**
         * Check if user is logged in
         * @returns {boolean} True if user is logged in
         */
        isLoggedIn: () => {
            return !!localStorage.getItem(CONFIG.AUTH.TOKEN_KEY);
        },
        
        /**
         * Check if current user is an influencer
         * @returns {boolean} True if user is an influencer
         */
        isInfluencer: () => {
            const user = UTILS.auth.getCurrentUser();
            return user && user.userType === 'influencer';
        },
        
        /**
         * Check if current user is a fan
         * @returns {boolean} True if user is a fan
         */
        isFan: () => {
            const user = UTILS.auth.getCurrentUser();
            return user && user.userType === 'fan';
        },
        
        /**
         * Logout current user
         */
        logout: () => {
            localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
            localStorage.removeItem(CONFIG.AUTH.USER_KEY);
            window.location.href = '/pages/auth/login.html';
        },
        
        /**
         * Redirect to login if not authenticated
         */
        requireAuth: () => {
            if (!UTILS.auth.isLoggedIn()) {
                window.location.href = '/pages/auth/login.html';
            }
        },
        
        /**
         * Redirect to login if not an influencer
         */
        requireInfluencer: () => {
            if (!UTILS.auth.isLoggedIn() || !UTILS.auth.isInfluencer()) {
                window.location.href = '/pages/auth/login.html';
            }
        },
        
        /**
         * Redirect to login if not a fan
         */
        requireFan: () => {
            if (!UTILS.auth.isLoggedIn() || !UTILS.auth.isFan()) {
                window.location.href = '/pages/auth/login.html';
            }
        }
    },
    
    /**
     * UI utilities
     */
    ui: {
        /**
         * Show an alert message
         * @param {string} message - Message to display
         * @param {string} type - Alert type (success, danger, warning, info)
         * @param {HTMLElement} container - Container to append the alert to
         * @param {number} duration - Auto-hide duration in ms (0 to keep visible)
         * @returns {HTMLElement} The alert element
         */
        showAlert: (message, type = 'info', container = document.body, duration = 5000) => {
            // Create alert element
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = message;
            alert.style.display = 'block';
            
            // Add to container
            container.prepend(alert);
            
            // Auto-hide if duration > 0
            if (duration > 0) {
                setTimeout(() => {
                    alert.style.opacity = '0';
                    alert.style.transition = 'opacity 0.5s ease';
                    
                    // Remove after fade out
                    setTimeout(() => {
                        if (alert.parentNode) {
                            alert.parentNode.removeChild(alert);
                        }
                    }, 500);
                }, duration);
            }
            
            return alert;
        },
        
        /**
         * Format file size
         * @param {number} bytes - File size in bytes
         * @returns {string} Formatted file size
         */
        formatFileSize: (bytes) => {
            if (bytes < 1024) {
                return bytes + ' bytes';
            } else if (bytes < 1024 * 1024) {
                return (bytes / 1024).toFixed(2) + ' KB';
            } else {
                return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
            }
        },
        
        /**
         * Toggle loading state of a button
         * @param {HTMLElement} button - Button element
         * @param {boolean} isLoading - Whether to show loading state
         * @param {string} loadingText - Text to show during loading
         * @param {string} originalText - Original button text
         */
        toggleButtonLoading: (button, isLoading, loadingText = 'Loading...', originalText = null) => {
            if (!button) return;
            
            if (isLoading) {
                // Save original text if not provided
                if (!originalText) {
                    button.dataset.originalText = button.innerHTML;
                }
                
                // Set loading state
                button.disabled = true;
                button.innerHTML = `
                    <span class="spinner" style="display: inline-block; margin-right: 8px;"></span>
                    ${loadingText}
                `;
            } else {
                // Restore original state
                button.disabled = false;
                button.innerHTML = originalText || button.dataset.originalText || button.innerHTML;
            }
        },
        
        /**
         * Create avatar initials for profile displays
         * @param {string} name - User name
         * @returns {string} Initials (max 2 characters)
         */
        getInitials: (name) => {
            if (!name) return '?';
            
            return name.split(' ')
                .map(part => part.charAt(0))
                .join('')
                .toUpperCase()
                .substring(0, 2);
        }
    },
    
    /**
     * Date and time utilities
     */
    date: {
        /**
         * Format date as relative time (e.g., "2 hours ago")
         * @param {Date|string} date - Date to format
         * @returns {string} Formatted relative time
         */
        formatRelativeTime: (date) => {
            const now = new Date();
            const inputDate = new Date(date);
            const diffMs = now - inputDate;
            const diffSec = Math.floor(diffMs / 1000);
            const diffMin = Math.floor(diffSec / 60);
            const diffHour = Math.floor(diffMin / 60);
            const diffDay = Math.floor(diffHour / 24);
            
            if (diffSec < 60) {
                return 'just now';
            } else if (diffMin < 60) {
                return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
            } else if (diffHour < 24) {
                return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
            } else if (diffDay < 7) {
                return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
            } else {
                // Format as date
                const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
                return inputDate.toLocaleDateString('en-US', options);
            }
        },
        
        /**
         * Format date in standard format
         * @param {Date|string} date - Date to format
         * @param {string} format - Format type (short, medium, long)
         * @returns {string} Formatted date
         */
        formatDate: (date, format = 'medium') => {
            const inputDate = new Date(date);
            
            const formats = {
                short: { month: 'numeric', day: 'numeric', year: '2-digit' },
                medium: { month: 'short', day: 'numeric', year: 'numeric' },
                long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
            };
            
            return inputDate.toLocaleDateString('en-US', formats[format] || formats.medium);
        },
        
        /**
         * Get date range for analytics
         * @param {string} range - Date range identifier
         * @returns {Object} Start and end dates
         */
        getDateRange: (range) => {
            const now = new Date();
            let start = new Date();
            let end = new Date();
            
            switch (range) {
                case 'today':
                    start.setHours(0, 0, 0, 0);
                    break;
                    
                case 'yesterday':
                    start.setDate(start.getDate() - 1);
                    start.setHours(0, 0, 0, 0);
                    end.setDate(end.getDate() - 1);
                    end.setHours(23, 59, 59, 999);
                    break;
                    
                case '7days':
                    start.setDate(start.getDate() - 6);
                    start.setHours(0, 0, 0, 0);
                    break;
                    
                case '30days':
                    start.setDate(start.getDate() - 29);
                    start.setHours(0, 0, 0, 0);
                    break;
                    
                case 'thisMonth':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
                    
                case 'lastMonth':
                    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                    break;
                    
                default:
                    start.setDate(start.getDate() - 30);
                    start.setHours(0, 0, 0, 0);
            }
            
            return { start, end };
        }
    },
    
    /**
     * String utilities
     */
    string: {
        /**
         * Escape HTML characters
         * @param {string} unsafe - String to escape
         * @returns {string} Escaped string
         */
        escapeHtml: (unsafe) => {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },
        
        /**
         * Truncate a string with ellipsis
         * @param {string} str - String to truncate
         * @param {number} maxLength - Maximum length
         * @returns {string} Truncated string
         */
        truncate: (str, maxLength) => {
            if (!str || str.length <= maxLength) {
                return str;
            }
            return str.substring(0, maxLength) + '...';
        },
        
        /**
         * Generate a random string
         * @param {number} length - Length of the string
         * @returns {string} Random string
         */
        randomString: (length = 8) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            return result;
        }
    },
    
    /**
     * Validation utilities
     */
    validation: {
        /**
         * Validate email format
         * @param {string} email - Email to validate
         * @returns {boolean} Whether email is valid
         */
        isValidEmail: (email) => {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        },
        
        /**
         * Validate password strength
         * @param {string} password - Password to validate
         * @returns {Object} Validation result with status and message
         */
        validatePassword: (password) => {
            if (!password || password.length < 6) {
                return {
                    valid: false,
                    message: 'Password must be at least 6 characters long'
                };
            }
            
            return { valid: true };
        },
        
        /**
         * Validate file type
         * @param {File} file - File to validate
         * @param {Array} allowedTypes - Allowed MIME types
         * @returns {boolean} Whether file type is valid
         */
        isValidFileType: (file, allowedTypes) => {
            return allowedTypes.includes(file.type);
        },
        
        /**
         * Validate file size
         * @param {File} file - File to validate
         * @param {number} maxSize - Maximum file size in bytes
         * @returns {boolean} Whether file size is valid
         */
        isValidFileSize: (file, maxSize) => {
            return file.size <= maxSize;
        }
    }
};

// Freeze the utils object to prevent modifications
Object.freeze(UTILS);
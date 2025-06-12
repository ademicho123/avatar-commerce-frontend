// static/embed/chatbot-widget.js - Embeddable chatbot widget

(function() {
    'use strict';
    
    // Prevent multiple initializations
    if (window.AvatarCommerceWidget) {
        return;
    }
    
    const AvatarCommerceWidget = {
        config: null,
        isOpen: false,
        sessionId: null,
        container: null,
        
        init: function(config) {
            this.config = {
                influencerId: config.influencerId,
                username: config.username,
                baseUrl: config.baseUrl,
                width: config.width || '400px',
                height: config.height || '600px',
                position: config.position || 'bottom-right',
                theme: config.theme || 'default',
                triggerText: config.triggerText || 'Chat with me!',
                autoOpen: config.autoOpen || false,
                customCss: config.customCss || ''
            };
            
            this.generateSessionId();
            this.createWidget();
            this.applyCustomStyles();
            
            if (this.config.autoOpen) {
                setTimeout(() => this.openChat(), 1000);
            }
        },
        
        generateSessionId: function() {
            // Generate a unique session ID for tracking
            this.sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        },
        
        createWidget: function() {
            // Create main container
            const container = document.createElement('div');
            container.id = 'avatarcommerce-widget';
            container.className = `ac-widget ac-position-${this.config.position} ac-theme-${this.config.theme}`;
            
            // Create trigger button
            const triggerBtn = document.createElement('button');
            triggerBtn.className = 'ac-trigger-btn';
            triggerBtn.innerHTML = `
                <span class="ac-trigger-text">${this.config.triggerText}</span>
                <span class="ac-trigger-icon">💬</span>
            `;
            triggerBtn.onclick = () => this.toggleChat();
            
            // Create chat container
            const chatContainer = document.createElement('div');
            chatContainer.className = 'ac-chat-container';
            chatContainer.style.display = 'none';
            chatContainer.innerHTML = this.getChatHTML();
            
            container.appendChild(triggerBtn);
            container.appendChild(chatContainer);
            
            // Add to page
            document.body.appendChild(container);
            this.container = container;
            
            // Initialize chat functionality
            this.initializeChat();
        },
        
        getChatHTML: function() {
            return `
                <div class="ac-chat-header">
                    <div class="ac-chat-title">
                        <span class="ac-avatar-indicator">🤖</span>
                        <span>Chat with ${this.config.username}</span>
                    </div>
                    <button class="ac-close-btn" onclick="AvatarCommerceWidget.closeChat()">×</button>
                </div>
                <div class="ac-chat-messages" id="ac-messages"></div>
                <div class="ac-chat-input-container">
                    <input type="text" id="ac-message-input" placeholder="Type your message..." maxlength="500">
                    <button id="ac-send-btn">Send</button>
                </div>
                <div class="ac-chat-footer">
                    <span>Powered by AvatarCommerce</span>
                </div>
            `;
        },
        
        initializeChat: function() {
            const messageInput = document.getElementById('ac-message-input');
            const sendBtn = document.getElementById('ac-send-btn');
            
            // Send message on button click
            sendBtn.onclick = () => this.sendMessage();
            
            // Send message on Enter key
            messageInput.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            };
            
            // Add welcome message
            this.addMessage('Hi! I\'m ' + this.config.username + '\'s AI assistant. How can I help you today?', 'bot');
        },
        
        toggleChat: function() {
            if (this.isOpen) {
                this.closeChat();
            } else {
                this.openChat();
            }
        },
        
        openChat: function() {
            const chatContainer = this.container.querySelector('.ac-chat-container');
            const triggerBtn = this.container.querySelector('.ac-trigger-btn');
            
            chatContainer.style.display = 'flex';
            triggerBtn.style.display = 'none';
            this.isOpen = true;
            
            // Focus on input
            setTimeout(() => {
                const input = document.getElementById('ac-message-input');
                if (input) input.focus();
            }, 100);
        },
        
        closeChat: function() {
            const chatContainer = this.container.querySelector('.ac-chat-container');
            const triggerBtn = this.container.querySelector('.ac-trigger-btn');
            
            chatContainer.style.display = 'none';
            triggerBtn.style.display = 'flex';
            this.isOpen = false;
        },
        
        sendMessage: function() {
            const input = document.getElementById('ac-message-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            this.addMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            // Send to backend
            this.sendToAPI(message);
        },
        
        addMessage: function(text, sender) {
            const messagesContainer = document.getElementById('ac-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `ac-message ac-message-${sender}`;
            
            const messageContent = document.createElement('div');
            messageContent.className = 'ac-message-content';
            messageContent.innerHTML = this.formatMessage(text);
            
            const messageTime = document.createElement('div');
            messageTime.className = 'ac-message-time';
            messageTime.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            messageDiv.appendChild(messageContent);
            messageDiv.appendChild(messageTime);
            messagesContainer.appendChild(messageDiv);
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },
        
        formatMessage: function(text) {
            // Basic formatting for links and line breaks
            return text
                .replace(/\n/g, '<br>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        },
        
        showTypingIndicator: function() {
            const messagesContainer = document.getElementById('ac-messages');
            const typingDiv = document.createElement('div');
            typingDiv.className = 'ac-message ac-message-bot ac-typing';
            typingDiv.id = 'ac-typing-indicator';
            typingDiv.innerHTML = `
                <div class="ac-message-content">
                    <div class="ac-typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            `;
            
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },
        
        hideTypingIndicator: function() {
            const typingIndicator = document.getElementById('ac-typing-indicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        },
        
        sendToAPI: function(message) {
            const apiUrl = `${this.config.baseUrl}/api/chat`;
            
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    influencer_id: this.config.influencerId,
                    session_id: this.sessionId,
                    voice_mode: false
                })
            })
            .then(response => response.json())
            .then(data => {
                this.hideTypingIndicator();
                
                if (data.status === 'success') {
                    // Add bot response
                    this.addMessage(data.data.text, 'bot');
                    
                    // Update session ID if provided
                    if (data.data.session_id) {
                        this.sessionId = data.data.session_id;
                    }
                    
                    // Handle video if available
                    if (data.data.video_url) {
                        this.addVideoMessage(data.data.video_url);
                    }
                } else {
                    this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                }
            })
            .catch(error => {
                console.error('Chat API error:', error);
                this.hideTypingIndicator();
                this.addMessage('Sorry, I\'m having trouble connecting. Please try again later.', 'bot');
            });
        },
        
        addVideoMessage: function(videoUrl) {
            const messagesContainer = document.getElementById('ac-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'ac-message ac-message-bot ac-message-video';
            
            const videoElement = document.createElement('video');
            videoElement.src = videoUrl;
            videoElement.controls = true;
            videoElement.style.maxWidth = '100%';
            videoElement.style.borderRadius = '8px';
            
            messageDiv.appendChild(videoElement);
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        },
        
        applyCustomStyles: function() {
            if (this.config.customCss) {
                const style = document.createElement('style');
                style.textContent = this.config.customCss;
                document.head.appendChild(style);
            }
            
            // Apply size configuration
            const chatContainer = this.container.querySelector('.ac-chat-container');
            if (chatContainer) {
                chatContainer.style.width = this.config.width;
                chatContainer.style.height = this.config.height;
            }
        }
    };
    
    // Make globally available
    window.AvatarCommerceWidget = AvatarCommerceWidget;
})();
// Simple Chat Widget
class LPGChatbot {
    constructor() {
        this.sessionId = null;
        this.user = JSON.parse(localStorage.getItem('user'));
        this.createWidget();
    }
    
    createWidget() {
        // Create chat button
        const btn = document.createElement('button');
        btn.id = 'chatButton';
        btn.innerHTML = '💬';
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #e74c3c;
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            font-size: 24px;
            z-index: 9999;
        `;
        
        // Create chat window
        const win = document.createElement('div');
        win.id = 'chatWindow';
        win.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 30px rgba(0,0,0,0.2);
            display: none;
            flex-direction: column;
            z-index: 9998;
            overflow: hidden;
        `;
        
        // Chat window content
        win.innerHTML = `
            <div style="background: #2c3e50; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-robot" style="font-size: 20px; color: #e74c3c;"></i>
                    <span style="font-weight: bold;">LPG Assistant</span>
                </div>
                <button id="closeChat" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">✖️</button>
            </div>
            <div id="chatMessages" style="flex: 1; padding: 15px; overflow-y: auto; background: #f8f9fa;"></div>
            <div style="padding: 15px; border-top: 1px solid #ddd; background: white;">
                <div style="display: flex; gap: 10px;">
                    <input id="chatInput" type="text" placeholder="Type your message..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    <button id="sendChat" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Send</button>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(btn);
        document.body.appendChild(win);
        
        // Add event listeners
        btn.onclick = () => this.toggleChat();
        document.getElementById('closeChat').onclick = () => this.closeChat();
        document.getElementById('sendChat').onclick = () => this.sendMessage();
        document.getElementById('chatInput').onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };
    }
    
    toggleChat() {
        const win = document.getElementById('chatWindow');
        if (win.style.display === 'none' || win.style.display === '') {
            win.style.display = 'flex';
            this.startSession();
        } else {
            win.style.display = 'none';
        }
    }
    
    closeChat() {
        document.getElementById('chatWindow').style.display = 'none';
    }
    
    async startSession() {
        this.addMessage('bot', '🤖 Hi! I\'m your LPG Assistant. How can I help you today?');
    }
    
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (!msg) return;
        
        this.addMessage('user', msg);
        input.value = '';
        
        // Simple bot responses
        setTimeout(() => {
            let response = '';
            if (msg.toLowerCase().includes('order') || msg.toLowerCase().includes('status')) {
                response = 'Your order is being processed. You can check "My Bookings" page for updates.';
            } else if (msg.toLowerCase().includes('book')) {
                response = 'To book a cylinder, please go to the homepage and click "Book Now" on any cylinder.';
            } else if (msg.toLowerCase().includes('price') || msg.toLowerCase().includes('cost')) {
                response = 'Our prices: 14.2kg - ₹1050, 5kg - ₹450, 19kg - ₹1850';
            } else if (msg.toLowerCase().includes('address')) {
                response = 'You can update your address in the registration page or contact support.';
            } else {
                response = 'I can help you with bookings, order status, prices, and more! What would you like to know?';
            }
            this.addMessage('bot', response);
        }, 500);
    }
    
    addMessage(role, text) {
        const msgs = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.style.display = 'flex';
        div.style.justifyContent = role === 'user' ? 'flex-end' : 'flex-start';
        div.innerHTML = `
            <div style="max-width: 80%; padding: 10px; border-radius: 10px; 
                background: ${role === 'user' ? '#e74c3c' : '#2c3e50'}; color: white;
                ${role === 'user' ? 'border-bottom-right-radius: 0;' : 'border-bottom-left-radius: 0;'}">
                ${text}
            </div>
        `;
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
    }
}

// Initialize when page loads
window.onload = function() {
    window.chat = new LPGChatbot();
};
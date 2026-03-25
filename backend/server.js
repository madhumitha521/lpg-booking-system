const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// Middleware
// CORS Configuration - Allow multiple origins
const allowedOrigins = [
    'http://localhost:5000',
    'http://localhost:3000',
    'http://localhost:5500',
    'https://your-frontend.vercel.app'  // We'll update this after Vercel deployment
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home route
app.get('/', (req, res) => {
    res.json({ message: '🎯 LPG Booking System API is running!' });
});

// Test database route
app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cylinder_types');
        res.json({ 
            success: true, 
            message: '✅ Database connected!',
            cylinders: rows 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// REGISTER API
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, phone, address, password } = req.body;
        
        // Check if user already exists
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert new user into database
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, phone, address, password_hash) VALUES (?, ?, ?, ?, ?)',
            [fullName, email, phone, address, hashedPassword]
        );
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: result.insertId
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// LOGIN API
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user by email
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        const user = users[0];
        
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { userId: user.user_id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Send success response
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user.user_id,
                name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});
// ============ OTP VERIFICATION ============
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');

// Create email transporter (using Gmail - free!)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send OTP via Email
app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Check if email exists
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        // Generate 6-digit OTP
        const otp = otpGenerator.generate(6, {
            digits: true,
            alphabets: false,
            upperCase: false,
            specialChars: false
        });
        
        // Set expiry (5 minutes from now)
        const expiresAt = new Date(Date.now() + 5 * 60000);
        
        // Delete any old OTPs for this email
        await db.query('DELETE FROM otp_verifications WHERE email = ?', [email]);
        
        // Save new OTP to database
        await db.query(
            'INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)',
            [email, otp, expiresAt]
        );
        
        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '🔐 LPG Booking - Login OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #e74c3c; text-align: center;">LPG Booking System</h2>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                        <h3 style="margin-bottom: 20px;">Your OTP for Login</h3>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2c3e50; background: white; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p style="color: #666;">This OTP is valid for 5 minutes.</p>
                        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                    </div>
                </div>
            `
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        
        // For development, also log OTP to console
        console.log(`📧 OTP for ${email}: ${otp}`);
        
        res.json({
            success: true,
            message: 'OTP sent to your email',
            // Remove this in production! Only for testing
            debug: otp
        });
        
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Check your email configuration.'
        });
    }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // Check if OTP exists and is valid
        const [records] = await db.query(
            'SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? AND expires_at > NOW() AND is_verified = FALSE ORDER BY id DESC LIMIT 1',
            [email, otp]
        );
        
        if (records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }
        
        // Mark as verified
        await db.query(
            'UPDATE otp_verifications SET is_verified = TRUE WHERE id = ?',
            [records[0].id]
        );
        
        // Check if user exists
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length > 0) {
            // User exists - login
            const token = jwt.sign(
                { userId: users[0].user_id, email: users[0].email, role: users[0].role },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                message: 'Login successful',
                token: token,
                user: {
                    id: users[0].user_id,
                    name: users[0].full_name,
                    email: users[0].email,
                    role: users[0].role
                }
            });
        } else {
            // New user - send to registration
            res.json({
                success: true,
                message: 'Email verified',
                isNewUser: true,
                email: email
            });
        }
        
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});
const { v4: uuidv4 } = require('uuid');

// ============ CHATBOT API ============

// Start a new chat session
app.post('/api/chat/start', async (req, res) => {
    try {
        const { userId } = req.body;
        const sessionId = uuidv4();
        
        // Initial bot greeting
        const initialMessages = [{
            role: 'bot',
            text: '🤖 Hi! I\'m your LPG Assistant. How can I help you today?',
            timestamp: new Date()
        }];
        
        await db.query(
            'INSERT INTO chat_sessions (user_id, session_id, messages) VALUES (?, ?, ?)',
            [userId || null, sessionId, JSON.stringify(initialMessages)]
        );
        
        res.json({
            success: true,
            sessionId,
            messages: initialMessages
        });
        
    } catch (error) {
        console.error('Chat start error:', error);
        res.status(500).json({ success: false, message: 'Failed to start chat' });
    }
});

// Send message and get response
app.post('/api/chat/message', async (req, res) => {
    try {
        const { sessionId, message, userId } = req.body;
        
        // Get current session
        const [sessions] = await db.query(
            'SELECT * FROM chat_sessions WHERE session_id = ?',
            [sessionId]
        );
        
        if (sessions.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        
        let session = sessions[0];
        let messages = JSON.parse(session.messages);
        
        // Add user message to history
        messages.push({
            role: 'user',
            text: message,
            timestamp: new Date()
        });
        
        // Generate bot response
        const botResponse = await generateBotResponse(message, userId);
        
        // Add bot response to history
        messages.push({
            role: 'bot',
            text: botResponse.text,
            action: botResponse.action,
            timestamp: new Date()
        });
        
        // Update session
        await db.query(
            'UPDATE chat_sessions SET messages = ?, updated_at = NOW() WHERE session_id = ?',
            [JSON.stringify(messages), sessionId]
        );
        
        res.json({
            success: true,
            messages: [{
                role: 'bot',
                text: botResponse.text,
                action: botResponse.action
            }]
        });
        
    } catch (error) {
        console.error('Chat message error:', error);
        res.status(500).json({ success: false, message: 'Failed to process message' });
    }
});

// Get chat history
app.get('/api/chat/history/:sessionId', async (req, res) => {
    try {
        const [sessions] = await db.query(
            'SELECT messages FROM chat_sessions WHERE session_id = ?',
            [req.params.sessionId]
        );
        
        if (sessions.length === 0) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }
        
        res.json({
            success: true,
            messages: JSON.parse(sessions[0].messages)
        });
        
    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({ success: false, message: 'Failed to get history' });
    }
});

// Bot response generator
async function generateBotResponse(userMessage, userId) {
    const message = userMessage.toLowerCase();
    
    // Check for order status queries
    if (message.includes('order') && (message.includes('status') || message.includes('track') || message.includes('where'))) {
        if (userId) {
            const [bookings] = await db.query(
                `SELECT b.*, c.name 
                 FROM bookings b
                 JOIN cylinder_types c ON b.cylinder_id = c.cylinder_id
                 WHERE b.user_id = ? AND b.booking_status != 'cancelled'
                 ORDER BY b.booking_date DESC LIMIT 1`,
                [userId]
            );
            
            if (bookings.length > 0) {
                const booking = bookings[0];
                return {
                    text: `Your recent order #${booking.booking_id} (${booking.name}) is **${booking.booking_status}**. Expected delivery: ${booking.delivery_date || 'Soon'}`,
                    action: null
                };
            }
        }
        return {
            text: 'I need your user ID to check orders. Please login first or provide your order number.',
            action: 'login_required'
        };
    }
    
    // Check for address change
    if (message.includes('address') && (message.includes('change') || message.includes('update'))) {
        return {
            text: 'I can help you update your address. Please enter your new delivery address:',
            action: 'update_address'
        };
    }
    
    // Check for booking
    if (message.includes('book') || message.includes('order') || message.includes('new')) {
        return {
            text: "I'll help you book a cylinder! Please select a size:\n1️⃣ 14.2kg (₹1050)\n2️⃣ 5kg (₹450)\n3️⃣ 19kg (₹1850)",
            action: 'start_booking'
        };
    }
    
    // Check for cancellation
    if (message.includes('cancel') || message.includes('stop')) {
        return {
            text: 'To cancel an order, please provide your order ID:',
            action: 'cancel_order'
        };
    }
    
    // Check FAQ database
    const [faqs] = await db.query(
        'SELECT * FROM faq_responses WHERE keywords LIKE ? LIMIT 1',
        [`%${message.split(' ').filter(w => w.length > 3).join('%')}%`]
    );
    
    if (faqs.length > 0) {
        return {
            text: faqs[0].response,
            action: null
        };
    }
    
    // Default response
    return {
        text: 'I can help you with:\n• Order status\n• Change address\n• New bookings\n• Cancellations\n• Price information\n\nWhat would you like to know?',
        action: null
    };
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Test the API at: http://localhost:${PORT}/api/test`);
});
// Book cylinder API
// Book cylinder API with payment
app.post('/api/book', async (req, res) => {
    try {
        const { userId, cylinderId, quantity, totalAmount, deliveryAddress, deliveryDate, specialInstructions, paymentMethod } = req.body;
        
        // Insert booking into database
        const [result] = await db.query(
            'INSERT INTO bookings (user_id, cylinder_id, quantity, total_amount, delivery_address, delivery_date, special_instructions, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, cylinderId, quantity, totalAmount, deliveryAddress, deliveryDate, specialInstructions, paymentMethod, 'pending']
        );
        
        res.status(201).json({
            success: true,
            message: 'Booking successful',
            bookingId: result.insertId,
            paymentMethod: paymentMethod
        });
        
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during booking'
        });
    }
});

// Update payment status API (simulate payment)
app.put('/api/update-payment/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const { paymentStatus, transactionId } = req.body;
        
        await db.query(
            'UPDATE bookings SET payment_status = ?, transaction_id = ? WHERE booking_id = ?',
            [paymentStatus, transactionId, bookingId]
        );
        
        res.json({
            success: true,
            message: 'Payment status updated'
        });
        
    } catch (error) {
        console.error('Payment update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Cancel booking API (add this after the book API)
app.put('/api/cancel-booking/:bookingId', async (req, res) => {
    try {
        const bookingId = req.params.bookingId;
        const { userId } = req.body;
        
        // Check if booking belongs to user
        const [booking] = await db.query(
            'SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?',
            [bookingId, userId]
        );
        
        if (booking.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }
        
        // Update booking status to cancelled
        await db.query(
            'UPDATE bookings SET booking_status = ? WHERE booking_id = ?',
            ['cancelled', bookingId]
        );
        
        res.json({
            success: true,
            message: 'Booking cancelled successfully'
        });
        
    } catch (error) {
        console.error('Cancel error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// Get user bookings API
app.get('/api/my-bookings/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const [bookings] = await db.query(
            `SELECT b.*, c.name, c.size_kg 
             FROM bookings b
             JOIN cylinder_types c ON b.cylinder_id = c.cylinder_id
             WHERE b.user_id = ?
             ORDER BY b.booking_date DESC`,
            [userId]
        );
        
        res.json({
            success: true,
            bookings: bookings
        });
        
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
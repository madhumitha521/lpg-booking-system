// Booking modal functionality with payment
function showBookingModal(cylinderId, price, cylinderName) {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        alert('Please login first');
        window.location.href = 'pages/login.html';
        return;
    }
    
    // Create modal HTML with payment options
    const modalHtml = `
        <div id="bookingModal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        ">
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
            ">
                <h2 style="margin-bottom: 1rem; color: #2c3e50;">Book ${cylinderName}</h2>
                
                <div style="margin-bottom: 1rem;">
                    <p><strong>Price:</strong> ₹${price} per cylinder</p>
                </div>
                
                <form id="bookingForm">
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Quantity:</label>
                        <input type="number" id="quantity" min="1" max="5" value="1" required
                               style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Delivery Date:</label>
                        <input type="date" id="deliveryDate" required
                               style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Delivery Address:</label>
                        <textarea id="address" rows="3" required
                                  style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">${user.address || ''}</textarea>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Special Instructions:</label>
                        <textarea id="instructions" rows="2"
                                  style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;" 
                                  placeholder="E.g., Leave at door, Call before delivery"></textarea>
                    </div>
                    
                    <div style="margin-bottom: 1rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Payment Method:</label>
                        <select id="paymentMethod" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="cash">Cash on Delivery</option>
                            <option value="upi">UPI (Google Pay/PhonePe/Paytm)</option>
                            <option value="card">Credit/Debit Card</option>
                            <option value="netbanking">Net Banking</option>
                        </select>
                    </div>
                    
                    <div id="upiDetails" style="display: none; margin-bottom: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 4px;">
                        <p><strong>UPI ID:</strong> lpgbooking@okhdfcbank</p>
                        <p><small>Complete payment in UPI app and enter transaction ID</small></p>
                        <input type="text" id="transactionId" placeholder="Enter UPI Transaction ID" 
                               style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    
                    <div id="cardDetails" style="display: none; margin-bottom: 1rem; padding: 1rem; background: #f0f9ff; border-radius: 4px;">
                        <p><small>Card payment simulation - In real app, you'd integrate with payment gateway</small></p>
                        <input type="text" placeholder="Card Number (XXXX-XXXX-XXXX-XXXX)" 
                               style="width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                            <input type="text" placeholder="MM/YY" style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                            <input type="text" placeholder="CVV" style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                        <p><strong>Total Amount:</strong> ₹<span id="totalAmount">${price}</span></p>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button type="submit" style="flex: 1; padding: 0.75rem; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Confirm Booking
                        </button>
                        <button type="button" onclick="closeBookingModal()" style="flex: 1; padding: 0.75rem; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('deliveryDate').min = today;
    document.getElementById('deliveryDate').value = today;
    
    // Show/hide payment details based on selection
    document.getElementById('paymentMethod').addEventListener('change', function() {
        document.getElementById('upiDetails').style.display = this.value === 'upi' ? 'block' : 'none';
        document.getElementById('cardDetails').style.display = this.value === 'card' ? 'block' : 'none';
    });
    
    // Update total when quantity changes
    document.getElementById('quantity').addEventListener('input', function() {
        const qty = this.value || 1;
        document.getElementById('totalAmount').textContent = qty * price;
    });
    
    // Handle form submission
    document.getElementById('bookingForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const quantity = document.getElementById('quantity').value;
        const deliveryDate = document.getElementById('deliveryDate').value;
        const address = document.getElementById('address').value;
        const instructions = document.getElementById('instructions').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const totalAmount = quantity * price;
        
        // For UPI, require transaction ID
        if (paymentMethod === 'upi') {
            const transactionId = document.getElementById('transactionId').value;
            if (!transactionId) {
                alert('Please enter UPI transaction ID');
                return;
            }
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    cylinderId: cylinderId,
                    quantity: quantity,
                    totalAmount: totalAmount,
                    deliveryAddress: address,
                    deliveryDate: deliveryDate,
                    specialInstructions: instructions,
                    paymentMethod: paymentMethod
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                let paymentMessage = '';
                if (paymentMethod === 'cash') {
                    paymentMessage = 'Pay ₹' + totalAmount + ' at delivery';
                } else if (paymentMethod === 'upi') {
                    paymentMessage = 'Payment verified!';
                } else {
                    paymentMessage = 'Payment processed successfully!';
                }
                
               // Show success animation instead of alert
showSuccessAnimation(data.bookingId, totalAmount);
closeBookingModal();
            } else {
                alert('Booking failed: ' + data.message);
            }
            
        } catch (error) {
            alert('Error making booking. Make sure backend is running.');
            console.error(error);
        }
    });
}

// Close modal function
function closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.remove();
    }
}
// Show success animation
function showSuccessAnimation(bookingId, amount) {
    const successHtml = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 2000;">
            <div style="text-align: center; background: white; padding: 2rem; border-radius: 8px; max-width: 400px;">
                <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style="display: block; margin: 0 auto;">
                    <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" style="stroke: #7ac142; stroke-width: 2;"/>
                    <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" style="stroke: white; stroke-width: 2;"/>
                </svg>
                <h3 style="color: #2c3e50; margin-top: 1rem;">Booking Successful!</h3>
                <p style="font-size: 1.2rem; margin: 0.5rem 0;"><strong>Booking ID: ${bookingId}</strong></p>
                <p style="color: #27ae60; font-weight: bold;">Amount: ₹${amount}</p>
                <button onclick="this.closest('div').closest('div').remove()" 
                        style="margin-top: 1rem; padding: 0.5rem 2rem; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;">
                    OK
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', successHtml);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        const modal = document.querySelector('div[style*="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8);"]');
        if (modal) modal.remove();
    }, 3000);
}
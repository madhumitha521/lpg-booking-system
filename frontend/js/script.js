// Load booking modal functions
const bookingModalScript = document.createElement('script');
bookingModalScript.src = 'js/booking-modal.js';
document.head.appendChild(bookingModalScript);

// Fetch cylinders from backend
async function loadCylinders() {
    try {
        const response = await fetch(`${window.API_URL}/test`);
        const data = await response.json();
        
        if (data.success) {
            displayCylinders(data.cylinders);
        }
    } catch (error) {
        console.error('Error loading cylinders:', error);
        document.getElementById('cylinderGrid').innerHTML = 
            '<p style="text-align: center; color: red;">Error loading cylinders. Make sure backend is running!</p>';
    }
}

// Display cylinders on page
function displayCylinders(cylinders) {
    const grid = document.getElementById('cylinderGrid');
    grid.innerHTML = '';
    
    cylinders.forEach(cylinder => {
        const card = document.createElement('div');
        card.className = 'cylinder-card';
        card.innerHTML = `
            <h3>${cylinder.name}</h3>
            <p class="price">₹${cylinder.price}</p>
            <p class="stock">Stock: ${cylinder.stock_quantity} available</p>
            <button class="btn btn-small" onclick="bookCylinder(${cylinder.cylinder_id})">
                Book Now
            </button>
        `;
        grid.appendChild(card);
    });
}

// Book cylinder function
function bookCylinder(cylinderId) {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        alert('Please login first to book a cylinder');
        window.location.href = 'pages/login.html';
        return;
    }
    
    // Get cylinder details
    fetch(`${window.API_URL}/test`)
        .then(res => res.json())
        .then(data => {
            const cylinder = data.cylinders.find(c => c.cylinder_id === cylinderId);
            // Show booking modal
            showBookingModal(cylinderId, cylinder.price, cylinder.name);
        });
}

// Make booking
async function makeBooking(cylinderId, price, user) {
    try {
        const response = await fetch(`${window.API_URL}/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: user.id,
                cylinderId: cylinderId,
                quantity: 1,
                totalAmount: price,
                deliveryAddress: user.address || 'Address not set'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Booking successful! Booking ID: ' + data.bookingId);
        } else {
            alert('Booking failed: ' + data.message);
        }
        
    } catch (error) {
        alert('Error making booking. Make sure backend is running.');
        console.error(error);
    }
}

// Load cylinders when page loads
document.addEventListener('DOMContentLoaded', loadCylinders);
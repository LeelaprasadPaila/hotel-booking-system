window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('preloader').classList.add('hidden');
    }, 1000);
});

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === sectionId) {
            link.classList.add('active');
        }
    });

    document.getElementById('navLinks').classList.remove('active');
    document.getElementById('hamburger').classList.remove('active');

    if (sectionId === 'rooms') {
        loadRoomsInfo();
    }
    if (sectionId === 'records') {
        loadRecords();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function attachNavHandlers() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(link.dataset.section);
        });
    });

    document.querySelectorAll('.footer-links a[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(link.dataset.section);
        });
    });

    document.querySelectorAll('.hero-buttons a[data-section]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(link.dataset.section);
        });
    });
}

function showResult(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = 'result-box show ' + type;
    el.innerHTML = message;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const roomImages = {
    standard_non_ac: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
    standard_ac: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
    three_bed_non_ac: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
    three_bed_ac: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
};

async function loadRoomsInfo() {
    const preview = document.getElementById('roomsPreview');
    const detail = document.getElementById('roomsInfo');
    if (!preview && !detail) return;

    try {
        const response = await fetch('/api/rooms-info');
        const rooms = await response.json();
        const roomEntries = Object.entries(rooms);

        const renderCards = (container, limit = roomEntries.length) => {
            if (!container) return;
            container.innerHTML = roomEntries.slice(0, limit).map(([key, room]) => {
                const name = room.name;
                const price = room.price;
                const amenities = room.amenities.split(', ');
                return `
                    <article class="room-card">
                        <div class="room-card-image" style="background-image: linear-gradient(135deg, rgba(7,17,29,0.2), rgba(7,17,29,0.35)), url('${roomImages[key] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'}');"></div>
                        <div class="room-card-price">Rs. ${price.toLocaleString()}</div>
                        <div class="room-card-body">
                            <h3>${name}</h3>
                            <p>${room.amenities}</p>
                            <div class="room-card-amenities">
                                ${amenities.slice(0, 3).map(a => `<span>${a}</span>`).join('')}
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
        };

        renderCards(preview, 3);
        renderCards(detail);
    } catch (error) {
        console.error('Error loading rooms:', error);
        if (preview) preview.innerHTML = '<p class="result-box error show">Unable to load room gallery right now.</p>';
        if (detail) detail.innerHTML = '<p class="result-box error show">Unable to load room gallery right now.</p>';
    }
}

async function loadRecentStays() {
    const container = document.getElementById('recentStays');
    if (!container) return;

    try {
        const response = await fetch('/api/records');
        const records = await response.json();
        const sample = records.slice(0, 3);

        if (!sample.length) {
            container.innerHTML = '<div class="recent-card"><h3>No sample arrivals yet</h3><p>Book a stay to see fresh guest stories here.</p></div>';
            return;
        }

        container.innerHTML = sample.map(record => `
            <article class="recent-card">
                <div class="meta">${record.room}</div>
                <h3>${record.name}</h3>
                <p>${record.address} • ${record.days} night stay</p>
                <p>Check-in ${record.checkin} • Check-out ${record.checkout}</p>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error loading recent stays:', error);
        container.innerHTML = '<div class="recent-card"><h3>Sample arrivals unavailable</h3><p>Please refresh the page to try again.</p></div>';
    }
}

async function placeOrder() {
    const customerId = document.getElementById('custId').value;
    if (!customerId) {
        showResult('restaurantResult', '❌ Please enter your Customer ID', 'error');
        return;
    }

    const selectedItems = [];
    document.querySelectorAll('#restaurant input[type="checkbox"]:checked').forEach(cb => {
        selectedItems.push(parseInt(cb.value));
    });

    if (selectedItems.length === 0) {
        showResult('restaurantResult', '❌ Please select at least one item', 'error');
        return;
    }

    try {
        const response = await fetch('/api/restaurant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: parseInt(customerId), items: selectedItems })
        });
        const data = await response.json();

        if (data.success) {
            showResult('restaurantResult', `
                <h3>✅ Order placed successfully!</h3>
                <p><strong>Customer:</strong> ${data.customer_name}</p>
                <p><strong>Total Bill:</strong> Rs. ${data.total}</p>
            `, 'success');
            document.querySelectorAll('#restaurant input[type="checkbox"]:checked').forEach(cb => {
                cb.checked = false;
            });
        } else {
            showResult('restaurantResult', `❌ ${data.message}`, 'error');
        }
    } catch (error) {
        showResult('restaurantResult', '❌ Error: ' + error.message, 'error');
    }
}

async function checkPayment() {
    const phone = document.getElementById('payPhone').value;
    if (!phone) {
        showResult('paymentResult', '❌ Please enter your phone number', 'error');
        return;
    }

    try {
        const response = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });
        const data = await response.json();

        if (data.found) {
            if (data.already_paid) {
                showResult('paymentResult', '<h3>✅ Payment has been made!</h3><p>Thank you for staying with us. Visit again!</p>', 'success');
            } else {
                showResult('paymentResult', `
                    <h3>🧾 Your Bill</h3>
                    <div class="bill-details">
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Phone:</strong> ${data.phone}</p>
                        <p><strong>Address:</strong> ${data.address}</p>
                        <p><strong>Check-In:</strong> ${data.checkin}</p>
                        <p><strong>Check-Out:</strong> ${data.checkout}</p>
                        <p><strong>Room Type:</strong> ${data.room}</p>
                        <p><strong>Room No:</strong> ${data.room_no}</p>
                        <p><strong>Room Charges:</strong> Rs. ${data.room_charges}</p>
                        <p><strong>Restaurant Charges:</strong> Rs. ${data.restaurant_charges}</p>
                        <p class="total"><strong>Total Amount:</strong> Rs. ${data.total}</p>
                    </div>
                    <button class="btn-gold" onclick="confirmPayment('${phone}')" style="margin-top: 15px;">Confirm Payment</button>
                `, 'info');
            }
        } else {
            showResult('paymentResult', '❌ No booking found with this phone number', 'error');
        }
    } catch (error) {
        showResult('paymentResult', '❌ Error: ' + error.message, 'error');
    }
}

async function confirmPayment(phone) {
    try {
        const response = await fetch('/api/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });
        const data = await response.json();

        if (data.success) {
            showResult('paymentResult', '<h3>✅ Payment Successful!</h3><p>Thank you for your payment. Visit again!</p>', 'success');
            document.getElementById('payPhone').value = '';
        } else {
            showResult('paymentResult', `❌ ${data.message}`, 'error');
        }
    } catch (error) {
        showResult('paymentResult', '❌ Error: ' + error.message, 'error');
    }
}

async function loadRecords() {
    try {
        const response = await fetch('/api/records');
        const records = await response.json();
        const container = document.getElementById('recordsTable');

        if (!container) return;

        if (records.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No records found</p>';
            return;
        }

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                        <th>Room Type</th>
                        <th>Room No</th>
                        <th>Price/Night</th>
                        <th>Days</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        records.forEach(record => {
            const status = record.paid === 1
                ? '<span class="paid-badge">Paid</span>'
                : '<span class="pending-badge">Pending</span>';

            tableHTML += `
                <tr>
                    <td>${record.name}</td>
                    <td>${record.phone}</td>
                    <td>${record.address}</td>
                    <td>${record.checkin}</td>
                    <td>${record.checkout}</td>
                    <td>${record.room}</td>
                    <td>${record.room_no || '-'}</td>
                    <td>Rs. ${record.price}</td>
                    <td>${record.days}</td>
                    <td>${status}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        container.innerHTML = tableHTML;
    } catch (error) {
        console.error('Error loading records:', error);
        document.getElementById('recordsTable').innerHTML = '<p style="color: red;">Error loading records</p>';
    }
}

function attachFormHandlers() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                checkin: document.getElementById('checkin').value,
                checkout: document.getElementById('checkout').value,
                room_type: document.getElementById('room_type').value
            };

            if (!Object.values(payload).every(Boolean)) {
                showResult('bookingResult', '❌ Please fill in all booking details.', 'error');
                return;
            }

            try {
                const response = await fetch('/api/booking', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();

                if (result.success) {
                    showResult('bookingResult', `
                        <h3>✅ Booking confirmed!</h3>
                        <p><strong>Room:</strong> ${result.room_type}</p>
                        <p><strong>Room No:</strong> ${result.room_no}</p>
                        <p><strong>Customer ID:</strong> ${result.customer_id}</p>
                        <p><strong>Price:</strong> Rs. ${result.price}</p>
                    `, 'success');
                    bookingForm.reset();
                } else {
                    showResult('bookingResult', `❌ ${result.message}`, 'error');
                }
            } catch (error) {
                showResult('bookingResult', '❌ Error: ' + error.message, 'error');
            }
        });
    }
}

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
function nextSlide() {
    if (!slides.length) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}
setInterval(nextSlide, 5000);

window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('active');
    document.getElementById('hamburger').classList.toggle('active');
});

document.addEventListener('DOMContentLoaded', () => {
    attachNavHandlers();
    attachFormHandlers();
    loadRoomsInfo();
    loadRecentStays();
    loadRecords();
});

window.placeOrder = placeOrder;
window.checkPayment = checkPayment;
window.confirmPayment = confirmPayment;
window.loadRecords = loadRecords;
import os
from flask import Flask, render_template, request, jsonify
import random
import datetime

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TEMPLATE_DIR = BASE_DIR
STATIC_DIR = os.path.join(BASE_DIR, 'static')

app = Flask(__name__, template_folder=TEMPLATE_DIR, static_folder=STATIC_DIR)

# Global data storage
data = {
    'name': [], 'phno': [], 'add': [], 'checkin': [], 'checkout': [],
    'room': [], 'price': [], 'rc': [], 'p': [], 'roomno': [], 'custid': [], 'day': []
}
i = 0

def validate_date(c):
    return 2022 <= c[2] <= 2030

# Sample data for demonstration
def load_sample_data():
    global i
    sample_bookings = [
        {'name': 'Rahul Sharma', 'phno': '9876543210', 'add': 'Mumbai, Maharashtra', 'checkin': '15/08/2024', 'checkout': '18/08/2024', 'room': 'Standard Ac', 'price': 4000, 'rc': 450, 'p': 1, 'roomno': 0, 'custid': 0, 'day': 3},
        {'name': 'Priya Patel', 'phno': '9123456780', 'add': 'Ahmedabad, Gujarat', 'checkin': '20/08/2024', 'checkout': '23/08/2024', 'room': '3-Bed Ac', 'price': 5000, 'rc': 720, 'p': 0, 'roomno': 312, 'custid': 15, 'day': 3},
        {'name': 'Amit Kumar', 'phno': '9988776655', 'add': 'Delhi, India', 'checkin': '25/08/2024', 'checkout': '28/08/2024', 'room': 'Standard Non-Ac', 'price': 3500, 'rc': 280, 'p': 0, 'roomno': 305, 'custid': 22, 'day': 3},
        {'name': 'Sneha Reddy', 'phno': '9012345678', 'add': 'Hyderabad, Telangana', 'checkin': '01/09/2024', 'checkout': '05/09/2024', 'room': '3-Bed Non-Ac', 'price': 4500, 'rc': 560, 'p': 0, 'roomno': 318, 'custid': 28, 'day': 4},
        {'name': 'Vikram Singh', 'phno': '8765432109', 'add': 'Jaipur, Rajasthan', 'checkin': '05/09/2024', 'checkout': '07/09/2024', 'room': 'Standard Ac', 'price': 4000, 'rc': 350, 'p': 1, 'roomno': 0, 'custid': 0, 'day': 2},
    ]
    for b in sample_bookings:
        data['name'].append(b['name'])
        data['phno'].append(b['phno'])
        data['add'].append(b['add'])
        data['checkin'].append(b['checkin'])
        data['checkout'].append(b['checkout'])
        data['room'].append(b['room'])
        data['price'].append(b['price'])
        data['rc'].append(b['rc'])
        data['p'].append(b['p'])
        data['roomno'].append(b['roomno'])
        data['custid'].append(b['custid'])
        data['day'].append(b['day'])
        i += 1

load_sample_data()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/rooms-info')
def rooms_info():
    rooms = {
        'standard_non_ac': {'name': 'Standard Non-AC', 'price': 3500,
            'amenities': '1 Double Bed, Television, Telephone, Double-Door Cupboard, 1 Coffee table with 2 sofa, Balcony'},
        'standard_ac': {'name': 'Standard AC', 'price': 4000,
            'amenities': '1 Double Bed, Television, Telephone, Double-Door Cupboard, 1 Coffee table with 2 sofa, Balcony and Window/Split AC'},
        'three_bed_non_ac': {'name': '3-Bed Non-AC', 'price': 4500,
            'amenities': '1 Double Bed + 1 Single Bed, Television, Telephone, a Triple-Door Cupboard, 1 Coffee table with 2 sofa, 1 Side table, Balcony with an Accent table with 2 Chair'},
        'three_bed_ac': {'name': '3-Bed AC', 'price': 5000,
            'amenities': '1 Double Bed + 1 Single Bed, Television, Telephone, a Triple-Door Cupboard, 1 Coffee table with 2 sofa, 1 Side table, Balcony with an Accent table with 2 Chair and Window/Split AC'}
    }
    return jsonify(rooms)

@app.route('/api/booking', methods=['POST'])
def booking():
    global i
    try:
        req_data = request.get_json()
        name = req_data.get('name')
        phno = req_data.get('phone')
        add = req_data.get('address')
        checkin = req_data.get('checkin')
        checkout = req_data.get('checkout')
        room_type = req_data.get('room_type')

        if not all([name, phno, add, checkin, checkout, room_type]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400

        ci_parts = checkin.split('/')
        co_parts = checkout.split('/')
        ci = [int(ci_parts[0]), int(ci_parts[1]), int(ci_parts[2])]
        co = [int(co_parts[0]), int(co_parts[1]), int(co_parts[2])]

        if not validate_date(ci) or not validate_date(co):
            return jsonify({'success': False, 'message': 'Invalid date'}), 400

        d1 = datetime.datetime(ci[2], ci[1], ci[0])
        d2 = datetime.datetime(co[2], co[1], co[0])
        days = (d2 - d1).days

        if days <= 0:
            return jsonify({'success': False, 'message': 'Check-out date must be after check-in'}), 400

        room_prices = {
            'standard_non_ac': 3500, 'standard_ac': 4000,
            'three_bed_non_ac': 4500, 'three_bed_ac': 5000
        }

        if room_type not in room_prices:
            return jsonify({'success': False, 'message': 'Invalid room type'}), 400

        rn = random.randrange(40) + 300
        cid = random.randrange(40) + 10
        while rn in data['roomno'] or cid in data['custid']:
            rn = random.randrange(60) + 300
            cid = random.randrange(60) + 10

        data['name'].append(name)
        data['phno'].append(phno)
        data['add'].append(add)
        data['checkin'].append(checkin)
        data['checkout'].append(checkout)
        data['room'].append(room_type.replace('_', ' ').title())
        data['price'].append(room_prices[room_type])
        data['rc'].append(0)
        data['p'].append(0)
        data['roomno'].append(rn)
        data['custid'].append(cid)
        data['day'].append(days)
        i += 1

        return jsonify({
            'success': True, 'message': 'Room booked successfully',
            'room_no': rn, 'customer_id': cid,
            'room_type': room_type.replace('_', ' ').title(),
            'price': room_prices[room_type], 'days': days
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/records')
def get_records():
    records = []
    for n in range(i):
        records.append({
            'name': data['name'][n], 'phone': data['phno'][n], 'address': data['add'][n],
            'checkin': data['checkin'][n], 'checkout': data['checkout'][n],
            'room': data['room'][n], 'price': data['price'][n],
            'room_no': data['roomno'][n], 'customer_id': data['custid'][n],
            'days': data['day'][n], 'paid': data['p'][n]
        })
    return jsonify(records)

@app.route('/api/payment', methods=['POST'])
def payment():
    global i
    try:
        req_data = request.get_json()
        phone = req_data.get('phone')
        if not phone:
            return jsonify({'success': False, 'message': 'Phone number is required'}), 400

        for n in range(i):
            if data['phno'][n] == phone:
                if data['p'][n] == 0:
                    total = (data['price'][n] * data['day'][n]) + data['rc'][n]
                    return jsonify({
                        'success': True, 'found': True,
                        'name': data['name'][n], 'phone': data['phno'][n],
                        'address': data['add'][n], 'checkin': data['checkin'][n],
                        'checkout': data['checkout'][n], 'room': data['room'][n],
                        'room_charges': data['price'][n] * data['day'][n],
                        'restaurant_charges': data['rc'][n],
                        'total': total, 'customer_id': data['custid'][n],
                        'room_no': data['roomno'][n]
                    })
                else:
                    return jsonify({'success': True, 'found': True, 'already_paid': True})
        return jsonify({'success': True, 'found': False})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/confirm-payment', methods=['POST'])
def confirm_payment():
    global i
    try:
        req_data = request.get_json()
        phone = req_data.get('phone')
        for n in range(i):
            if data['phno'][n] == phone and data['p'][n] == 0:
                data['p'][n] = 1
                data['roomno'][n] = 0
                data['custid'][n] = 0
                return jsonify({'success': True, 'message': 'Payment successful'})
        return jsonify({'success': False, 'message': 'Payment not found or already paid'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/restaurant', methods=['POST'])
def restaurant():
    global i
    try:
        req_data = request.get_json()
        customer_id = req_data.get('customer_id')
        items = req_data.get('items', [])

        customer_idx = None
        for n in range(i):
            if data['custid'][n] == customer_id and data['p'][n] == 0:
                customer_idx = n
                break

        if customer_idx is None:
            return jsonify({'success': False, 'message': 'Invalid Customer ID'}), 404

        menu_prices = {
            1: 20, 2: 25, 3: 25, 4: 25, 5: 30, 6: 30,
            7: 50, 8: 50, 9: 70, 10: 70,
            11: 110, 12: 110, 13: 110, 14: 110, 15: 110,
            16: 110, 17: 110, 18: 120, 19: 120, 20: 140,
            21: 140, 22: 140, 23: 140, 24: 140, 25: 140,
            26: 140, 27: 150, 28: 150, 29: 15, 30: 15,
            31: 20, 32: 20, 33: 90, 34: 90, 35: 110,
            36: 110, 37: 100, 38: 110, 39: 130, 40: 130,
            41: 130, 42: 140, 43: 60, 44: 60, 45: 60, 46: 60
        }

        total = 0
        for item in items:
            if item in menu_prices:
                total += menu_prices[item]

        current_rc = data['rc'].pop(customer_idx)
        data['rc'].insert(customer_idx, current_rc + total)

        return jsonify({
            'success': True, 'message': 'Restaurant order placed',
            'total': total, 'customer_name': data['name'][customer_idx]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
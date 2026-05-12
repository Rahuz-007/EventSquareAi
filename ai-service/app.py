import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
from datetime import datetime, timedelta
import logging

load_dotenv()

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
try:
    client = MongoClient(os.getenv('MONGO_URI', 'mongodb://localhost:27017/eventsphere'))
    db = client.eventsphere
    logger.info("AI Service: MongoDB connected")
except Exception as e:
    logger.error(f"MongoDB connection failed: {e}")
    db = None

# ──────────────────────────────────────────────
# Recommendation Engine
# ──────────────────────────────────────────────

def encode_category(category):
    """Simple one-hot encoding for categories"""
    categories = ['music', 'tech', 'sports', 'art', 'food', 'business', 'health', 'education', 'comedy', 'other']
    vec = [0.0] * len(categories)
    if category in categories:
        vec[categories.index(category)] = 1.0
    return vec

def build_event_vector(event):
    """Build feature vector for an event"""
    cat_vec = encode_category(event.get('category', 'other'))
    price_norm = min(event.get('minPrice', 0) / 10000.0, 1.0)
    rating_norm = event.get('rating', {}).get('average', 0) / 5.0
    views_norm = min(event.get('views', 0) / 10000.0, 1.0)
    sold_norm = min(event.get('totalSold', 0) / 500.0, 1.0)
    return cat_vec + [price_norm, rating_norm, views_norm, sold_norm]

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        user_categories = data.get('categories', [])
        user_tags = data.get('tags', [])
        event_ids = data.get('event_ids', [])

        if not event_ids:
            return jsonify({'reranked': []})

        # Build user preference vector
        user_category = user_categories[0] if user_categories else 'other'
        user_vec = encode_category(user_category) + [0.5, 0.7, 0.5, 0.5]

        # Score each event
        scored = []
        for event_id in event_ids:
            try:
                if db:
                    from bson.objectid import ObjectId
                    event = db.events.find_one({'_id': ObjectId(event_id)})
                    if event:
                        event_vec = build_event_vector(event)
                        score = cosine_similarity([user_vec], [event_vec])[0][0]
                        # Boost if category matches
                        if event.get('category') in user_categories:
                            score += 0.3
                        # Boost if tags match
                        event_tags = event.get('tags', [])
                        tag_overlap = len(set(event_tags) & set(user_tags))
                        score += tag_overlap * 0.05
                        scored.append({'event_id': event_id, 'score': float(score)})
                    else:
                        scored.append({'event_id': event_id, 'score': 0.5})
                else:
                    scored.append({'event_id': event_id, 'score': 0.5})
            except Exception as e:
                scored.append({'event_id': event_id, 'score': 0.5})

        scored.sort(key=lambda x: x['score'], reverse=True)
        return jsonify({'reranked': scored, 'model': 'cosine_similarity_v1'})

    except Exception as e:
        logger.error(f"Recommendation error: {e}")
        return jsonify({'error': str(e)}), 500

# ──────────────────────────────────────────────
# Fraud Detection
# ──────────────────────────────────────────────

@app.route('/fraud/analyze', methods=['POST'])
def analyze_fraud():
    try:
        data = request.json
        features = {
            'quantity': data.get('quantity', 1),
            'amount': data.get('amount', 0),
            'hour_of_day': datetime.now().hour,
            'is_new_user': data.get('is_new_user', False),
            'recent_bookings': data.get('recent_bookings', 0),
            'failed_payments': data.get('failed_payments', 0),
        }

        # Rule-based scoring
        score = 0
        flags = []

        if features['quantity'] > 8:
            score += 25
            flags.append('high_quantity')
        if features['amount'] > 50000:
            score += 20
            flags.append('large_amount')
        if features['is_new_user'] and features['amount'] > 5000:
            score += 20
            flags.append('new_user_high_value')
        if features['recent_bookings'] > 5:
            score += 30
            flags.append('rapid_bookings')
        if features['failed_payments'] > 2:
            score += 25
            flags.append('failed_payment_history')
        if features['hour_of_day'] in [0, 1, 2, 3]:
            score += 5
            flags.append('odd_hours')

        risk_level = 'low' if score < 30 else 'medium' if score < 60 else 'high'

        return jsonify({
            'score': min(score, 100),
            'risk_level': risk_level,
            'flags': flags,
            'recommendation': 'block' if score > 80 else 'review' if score > 50 else 'allow',
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ──────────────────────────────────────────────
# Analytics Endpoint
# ──────────────────────────────────────────────

@app.route('/analytics', methods=['GET'])
def get_analytics():
    try:
        analytics = {
            'model_status': 'active',
            'recommendation_engine': 'cosine_similarity_v1',
            'fraud_detection': 'rule_based_v2',
            'last_updated': datetime.utcnow().isoformat(),
        }

        if db:
            analytics['total_events_indexed'] = db.events.count_documents({})
            analytics['total_users'] = db.users.count_documents({})
            analytics['flagged_bookings'] = db.bookings.count_documents({'isFlagged': True})

        return jsonify(analytics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ──────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'service': 'EventSphere AI Microservice', 'timestamp': datetime.utcnow().isoformat()})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    logger.info(f"🤖 AI Microservice starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)

from flask import Flask, jsonify, request, render_template
import os
from similarity import cosine_similarity, jaccard_similarity
from candidate_generator import generate_candidates
from scorer import score_candidates
from evaluator import precision_at_k

app = Flask(__name__)

# Sample Dataset: Movie ratings (1-5 stars) for different user profiles
# This represents the historical training data.
USER_DATA = {
    "Alice": {
        "Toy Story": 5.0,
        "Finding Nemo": 5.0,
        "Up": 4.5,
        "Interstellar": 4.0,
        "The Matrix": 3.5
    },
    "Bob": {
        "Interstellar": 5.0,
        "The Matrix": 5.0,
        "Iron Man": 4.5,
        "The Dark Knight": 4.0,
        "Avatar": 3.5
    },
    "Charlie": {
        "Toy Story": 4.0,
        "The Notebook": 5.0,
        "La La Land": 4.5,
        "About Time": 4.0
    },
    "David": {
        "Iron Man": 5.0,
        "The Avengers": 4.5,
        "The Notebook": 3.0,
        "Titanic": 4.0,
        "Gladiator": 4.5
    },
    "Eve": {
        "Toy Story": 4.5,
        "Finding Nemo": 4.0,
        "Up": 5.0,
        "Interstellar": 4.5,
        "Avatar": 4.0
    },
    "Frank": {
        "Iron Man": 4.0,
        "The Dark Knight": 5.0,
        "The Avengers": 4.0,
        "Interstellar": 4.0,
        "The Matrix": 4.5
    },
    "Grace": {
        "The Dark Knight": 5.0
    },
    "Henry": {
        "The Notebook": 4.5,
        "La La Land": 5.0,
        "Titanic": 3.5,
        "About Time": 4.5
    }
}

# Ground Truth: Movie ratings or list of items liked later (used for testing evaluation)
GROUND_TRUTH = {
    "Alice": ["Monsters Inc.", "Spider-Man: Into the Spider-Verse", "The Avengers"],
    "Bob": ["Blade Runner 2049", "Inception", "Gladiator"],
    "Charlie": ["Titanic", "Up", "Monsters Inc."],
    "David": ["The Dark Knight", "La La Land", "Blade Runner 2049"],
    "Eve": ["Monsters Inc.", "Spider-Man: Into the Spider-Verse", "The Matrix"],
    "Frank": ["Inception", "Avatar", "Gladiator"],
    "Grace": ["Iron Man", "The Avengers", "The Matrix"],
    "Henry": ["Toy Story", "Up", "La La Land"]
}

# All available items in our mini-universe
ALL_ITEMS = [
    "Toy Story", "Finding Nemo", "Up", "Interstellar", "The Matrix",
    "Iron Man", "The Dark Knight", "Avatar", "The Notebook", "La La Land",
    "About Time", "The Avengers", "Titanic", "Gladiator", "Monsters Inc.",
    "Spider-Man: Into the Spider-Verse", "Blade Runner 2049", "Inception"
]

@app.route('/')
def home():
    # Renders the single-page dashboard
    return render_template('index.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    """Returns the sample dataset for display."""
    return jsonify({
        "users": list(USER_DATA.keys()),
        "ratings": USER_DATA,
        "ground_truth": GROUND_TRUTH,
        "all_items": ALL_ITEMS
    })

@app.route('/api/recommend', methods=['POST'])
def recommend():
    """Runs the recommendation pipeline and returns step-by-step debug information."""
    data = request.json or {}
    
    target_user = data.get('target_user', 'Alice')
    similarity_type = data.get('similarity_type', 'cosine')
    top_k_users = int(data.get('top_k_users', 3))
    top_n_recs = int(data.get('top_n_recs', 5))
    eval_k = int(data.get('eval_k', 3))
    
    if target_user not in USER_DATA:
        return jsonify({"error": f"User {target_user} not found"}), 400
        
    # Step 1: Compute Similarities for Debug Output
    similarities = []
    target_profile = USER_DATA[target_user]
    for other_user, other_profile in USER_DATA.items():
        if other_user == target_user:
            continue
        if similarity_type == 'cosine':
            sim = cosine_similarity(target_profile, other_profile)
        elif similarity_type == 'jaccard':
            s1 = set(target_profile.keys())
            s2 = set(other_profile.keys())
            sim = jaccard_similarity(s1, s2)
        similarities.append({"user": other_user, "score": round(sim, 4)})
        
    # Sort similar users descending
    similarities.sort(key=lambda x: x['score'], reverse=True)
    neighbors = [s for s in similarities if s['score'] > 0][:top_k_users]
    
    # Step 2: Candidate Generation
    candidates = generate_candidates(target_user, USER_DATA, similarity_type, top_k_users)
    
    # Step 3: Candidate Scoring & Ranking
    recommendations = score_candidates(target_user, candidates, USER_DATA, similarity_type, top_n_recs)
    
    # Step 4: Evaluation
    user_ground_truth = GROUND_TRUTH.get(target_user, [])
    precision = precision_at_k(recommendations, user_ground_truth, eval_k)
    
    return jsonify({
        "target_user": target_user,
        "similarity_type": similarity_type,
        "all_similarities": similarities,
        "neighbors": neighbors,
        "candidates": candidates,
        "recommendations": recommendations,
        "ground_truth": user_ground_truth,
        "precision": precision,
        "eval_k": eval_k
    })

if __name__ == '__main__':
    # Bind to port 5000 and run the Flask dev server
    app.run(debug=True, port=5000)

from similarity import cosine_similarity, jaccard_similarity

def score_candidates(target_user: str, candidates: list, user_data: dict, similarity_type: str = 'cosine', top_n: int = 5) -> list:
    """
    Scores and ranks candidate items for a target user using weighted user similarities.
    
    Args:
        target_user (str): Target user ID.
        candidates (list): List of candidate item IDs.
        user_data (dict): User dataset.
                          - For 'cosine': {user_id: {item_id: rating}}
                          - For 'jaccard': {user_id: {item_id1, item_id2, ...}} or {user_id: {item_id: rating}}
        similarity_type (str): 'cosine' or 'jaccard'.
        top_n (int): Maximum number of top recommendations to return.
        
    Returns:
        list of tuples: A sorted list of (item_id, score) tuples, ordered by score descending.
    """
    if not candidates or target_user not in user_data:
        return []
        
    target_profile = user_data[target_user]
    
    # Calculate similarity with all other users first to avoid redundant calculations
    user_similarities = {}
    for other_user, other_profile in user_data.items():
        if other_user == target_user:
            continue
            
        if similarity_type == 'cosine':
            p1 = target_profile if isinstance(target_profile, dict) else {x: 1.0 for x in target_profile}
            p2 = other_profile if isinstance(other_profile, dict) else {x: 1.0 for x in other_profile}
            sim = cosine_similarity(p1, p2)
        elif similarity_type == 'jaccard':
            s1 = set(target_profile.keys()) if isinstance(target_profile, dict) else set(target_profile)
            s2 = set(other_profile.keys()) if isinstance(other_profile, dict) else set(other_profile)
            sim = jaccard_similarity(s1, s2)
        else:
            raise ValueError(f"Unknown similarity type: {similarity_type}")
            
        if sim > 0:
            user_similarities[other_user] = sim
            
    scored_items = []
    
    for item in candidates:
        weighted_sum = 0.0
        similarity_sum = 0.0
        
        for other_user, similarity in user_similarities.items():
            other_profile = user_data[other_user]
            
            # Check if this other user interacted with the item
            if isinstance(other_profile, dict) and item in other_profile:
                rating = other_profile[item]
                weighted_sum += similarity * rating
                similarity_sum += abs(similarity)
            elif (isinstance(other_profile, set) or isinstance(other_profile, list)) and item in other_profile:
                # For sets/lists, interaction is treated as an implicit rating of 1.0
                weighted_sum += similarity * 1.0
                similarity_sum += abs(similarity)
                
        if similarity_sum > 0.0:
            predicted_score = weighted_sum / similarity_sum
        else:
            predicted_score = 0.0
            
        scored_items.append((item, round(predicted_score, 4)))
        
    # Sort descending by score; if tied, sort alphabetically by item ID
    scored_items.sort(key=lambda x: (-x[1], x[0]))
    
    return scored_items[:top_n]

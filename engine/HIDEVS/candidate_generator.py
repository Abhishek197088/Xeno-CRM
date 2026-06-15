from similarity import cosine_similarity, jaccard_similarity

def generate_candidates(target_user: str, user_data: dict, similarity_type: str = 'cosine', top_k_users: int = 3) -> list:
    """
    Generates candidate items for a target user based on similar users' preferences.
    
    Args:
        target_user (str): The ID of the target user.
        user_data (dict): The dataset of users. 
                          - For 'cosine': {user_id: {item_id: rating}}
                          - For 'jaccard': {user_id: {item_id1, item_id2, ...}} or {user_id: {item_id: rating}}
        similarity_type (str): 'cosine' or 'jaccard'.
        top_k_users (int): Maximum number of similar users to consider.
        
    Returns:
        list: A list of candidate item IDs that the target user has not interacted with.
    """
    if target_user not in user_data:
        return []
        
    target_profile = user_data[target_user]
    
    # Calculate similarities with all other users
    similarities = []
    for other_user, other_profile in user_data.items():
        if other_user == target_user:
            continue
            
        if similarity_type == 'cosine':
            # Profiles must be dicts for cosine similarity
            p1 = target_profile if isinstance(target_profile, dict) else {x: 1.0 for x in target_profile}
            p2 = other_profile if isinstance(other_profile, dict) else {x: 1.0 for x in other_profile}
            sim = cosine_similarity(p1, p2)
        elif similarity_type == 'jaccard':
            # Convert to sets of items
            s1 = set(target_profile.keys()) if isinstance(target_profile, dict) else set(target_profile)
            s2 = set(other_profile.keys()) if isinstance(other_profile, dict) else set(other_profile)
            sim = jaccard_similarity(s1, s2)
        else:
            raise ValueError(f"Unknown similarity type: {similarity_type}")
            
        if sim > 0:
            similarities.append((other_user, sim))
            
    # Sort similar users by similarity score descending
    similarities.sort(key=lambda x: x[1], reverse=True)
    top_neighbors = similarities[:top_k_users]
    
    # Gather candidates: items that neighbors rated/liked but target user hasn't seen
    target_seen = set(target_profile.keys()) if isinstance(target_profile, dict) else set(target_profile)
    candidates = set()
    
    for neighbor, _ in top_neighbors:
        neighbor_profile = user_data[neighbor]
        neighbor_items = set(neighbor_profile.keys()) if isinstance(neighbor_profile, dict) else set(neighbor_profile)
        unseen_by_target = neighbor_items.difference(target_seen)
        candidates.update(unseen_by_target)
        
    return list(candidates)

def precision_at_k(recommendations: list, ground_truth: list, k: int = 5) -> float:
    """
    Calculates the Precision@K metric for a set of recommendations.
    
    Formula:
        Precision@K = |(Recommended items in top K) intersect (Ground Truth)| / K
        
    Args:
        recommendations (list): List of recommended item IDs (can be strings, or tuples like (item_id, score)).
        ground_truth (list or set): List or set of actual items the user liked/interacted with (ground truth).
        k (int): Number of top recommendations to evaluate. Default is 5.
        
    Returns:
        float: Precision score between 0.0 and 1.0.
               Returns 0.0 if k <= 0, recommendations is empty, or ground_truth is empty.
    """
    if k <= 0 or not recommendations or not ground_truth:
        return 0.0
        
    # Clean recommendations to handle list of tuples (e.g. from scorer.py) or just lists of items
    clean_recs = []
    for rec in recommendations:
        if isinstance(rec, (list, tuple)) and len(rec) >= 1:
            clean_recs.append(rec[0])
        else:
            clean_recs.append(rec)
            
    # Take the top K recommendations
    top_k_recs = clean_recs[:k]
    
    # Cast ground truth to set for O(1) lookups
    gt_set = set(ground_truth)
    
    # Count overlapping items
    hits = sum(1 for item in top_k_recs if item in gt_set)
    
    # Precision@K is hits divided by K
    return round(hits / k, 4)

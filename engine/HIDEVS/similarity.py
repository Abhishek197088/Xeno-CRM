import math

def cosine_similarity(profile1: dict, profile2: dict) -> float:
    """
    Calculates the cosine similarity between two rating profiles.
    
    Profiles are represented as dictionaries: {item_id: rating}
    Formula:
        Cosine Similarity = sum(R_1,i * R_2,i) / (sqrt(sum(R_1,i^2)) * sqrt(sum(R_2,i^2)))
        
    Args:
        profile1 (dict): Ratings by user 1, e.g., {'item1': 4.0, 'item2': 5.0}
        profile2 (dict): Ratings by user 2, e.g., {'item2': 3.0, 'item3': 2.0}
        
    Returns:
        float: Similarity score between 0.0 and 1.0 (or -1.0 to 1.0 if ratings can be negative).
               Returns 0.0 if there is no overlap, or if either profile is empty.
    """
    if not profile1 or not profile2:
        return 0.0
        
    # Get common items
    common_items = set(profile1.keys()).intersection(set(profile2.keys()))
    if not common_items:
        return 0.0
        
    # Dot product of overlapping items
    dot_product = sum(profile1[item] * profile2[item] for item in common_items)
    
    # Magnitudes (Euclidean norms) of the full profiles
    magnitude1 = math.sqrt(sum(val ** 2 for val in profile1.values()))
    magnitude2 = math.sqrt(sum(val ** 2 for val in profile2.values()))
    
    denominator = magnitude1 * magnitude2
    if denominator == 0.0:
        return 0.0
        
    return dot_product / denominator

def jaccard_similarity(set1: set, set2: set) -> float:
    """
    Calculates the Jaccard similarity coefficient between two sets of items.
    
    Formula:
        Jaccard Similarity = |set1 intersect set2| / |set1 union set2|
        
    Args:
        set1 (set): Set of item IDs (e.g. liked items by user 1)
        set2 (set): Set of item IDs (e.g. liked items by user 2)
        
    Returns:
        float: Similarity score between 0.0 and 1.0.
               Returns 0.0 if the union is empty (both sets are empty).
    """
    # Cast to set to handle lists or tuples if passed
    s1 = set(set1) if not isinstance(set1, set) else set1
    s2 = set(set2) if not isinstance(set2, set) else set2
    
    if not s1 and not s2:
        return 0.0
        
    intersection = s1.intersection(s2)
    union = s1.union(s2)
    
    if not union:
        return 0.0
        
    return len(intersection) / len(union)

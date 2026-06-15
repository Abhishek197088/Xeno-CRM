# Recommendation Engine Simulator

An educational, interactive, and modular recommendation engine built from scratch in Python. It includes a beautiful glassmorphic dark-mode web interface using Flask, allowing you to simulate and visualize user-based collaborative filtering recommendations on `localhost`.

---

## Architecture Overview

The recommendation engine is built around **four core modules** that replicate the pipeline of major streaming and e-commerce platforms (like Netflix and Amazon):

```
                       +------------------------+
                       |    Raw User Ratings    |
                       +-----------+------------+
                                   |
                                   v
                       +------------------------+
                       | Similarity Calculator  | <--- (Cosine / Jaccard)
                       +-----------+------------+
                                   |
                                   v
                       +------------------------+
                       |  Candidate Generator   | <--- (Filter unseen items from neighbors)
                       +-----------+------------+
                                   |
                                   v
                       +------------------------+
                       |    Scorer & Ranker     | <--- (Calculate similarity-weighted scores)
                       +-----------+------------+
                                   |
                                   v
                       +------------------------+
                       |       Evaluator        | <--- (Compute Precision@K against holdout)
                       +------------------------+
```

---

## Core Modules & Mathematics

### 1. Similarity Calculator (`similarity.py`)
Computes how close two users' tastes are. It supports two main metrics:
*   **Cosine Similarity (Ratings-based)**:
    Measures the cosine of the angle between two multi-dimensional rating vectors.
    $$\text{Cosine Similarity}(u, v) = \frac{\sum (R_{u,i} \cdot R_{v,i})}{\sqrt{\sum R_{u,i}^2} \cdot \sqrt{\sum R_{v,i}^2}}$$
    *Best for explicit feedback, like 1-to-5 star ratings.*

*   **Jaccard Similarity (Interactions-based)**:
    Measures the ratio of overlapping interacted items to the total set of items interacted by either user.
    $$\text{Jaccard Similarity}(u, v) = \frac{|S_u \cap S_v|}{|S_u \cup S_v|}$$
    *Best for implicit feedback, like clicks, views, or purchase history.*

### 2. Candidate Generator (`candidate_generator.py`)
A recommendation system with thousands of items cannot score all of them in real-time. The Candidate Generator retrieves a subset of high-potential items by:
1.  Identifying the top $K$ most similar users (neighbors) with similarity $> 0$.
2.  Gathering the set of items that those neighbors rated or liked.
3.  Filtering out items that the target user has already seen or rated.

### 3. Scorer & Ranker (`scorer.py`)
Predicts the target user's ratings for the candidate items and ranks them:
*   We use a **weighted average** of the neighbors' ratings, where the weights are the similarity coefficients:
    $$\text{Score}(u, i) = \frac{\sum_{v \in \text{neighbors}} \text{similarity}(u, v) \cdot R_{v,i}}{\sum_{v} |\text{similarity}(u,v)|}$$
*   For Jaccard, interaction is treated as an implicit rating of $1.0$.
*   Returns the top $N$ items sorted descending by predicted rating.

### 4. Evaluator (`evaluator.py`)
Measures the quality of the recommendations against a holdout test set (ground truth items that the user actually liked later):
*   **Precision@K**: The percentage of recommended items in the top $K$ recommendations that are relevant (exist in the ground truth).
    $$\text{Precision@K} = \frac{|\text{Recommendations@K} \cap \text{Ground Truth}|}{K}$$

---

## File Structure

```
HIDEVS/
│
├── similarity.py           # Module 1: Cosine and Jaccard calculators
├── candidate_generator.py  # Module 2: Neighbors and candidate retrieval
├── scorer.py               # Module 3: Similarity-weighted ratings predictor
├── evaluator.py            # Module 4: Precision@K calculator
│
├── app.py                  # Flask web server exposing recommendation APIs
├── templates/
│   └── index.html          # HTML/CSS/JS frontend dashboard
│
└── README.md               # Documentation (this file)
```

---

## Getting Started (Local Host Execution)

### 1. Prerequisites
Ensure you have Python 3 installed on your system.

### 2. Install Flask
To run the interactive dashboard, install Flask:
```bash
pip3 install flask
```

### 3. Run the Server
Launch the server in development mode:
```bash
python3 app.py
```

### 4. Access the Dashboard
Open your web browser and navigate to:
```
http://127.0.0.1:5000/
```

---

## How to Test and Interact
1.  **Select a Target User**: Try picking `Alice` or `Bob` or others from the dropdown.
2.  **Toggle Similarity Metric**: Observe how changing between Cosine and Jaccard alters the similarity scores and the candidates generated.
3.  **Adjust Neighbors Slider**: Changing $K$ changes the pool of similar users who contribute candidate items and scores.
4.  **Verify the Math**:
    *   Inspect the **Raw Training Dataset** tab to see who rated what.
    *   Compare the similarity scores bar chart in **Step 1** with the rating matrix.
    *   Check how the recommendations map back to the scores.
    *   See the final evaluation score change based on your settings.

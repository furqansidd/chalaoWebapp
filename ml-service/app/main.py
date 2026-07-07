import os
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False
    print("WARNING: OpenCV (cv2) is not available. Computer Vision analysis will be mocked.")

try:
    from skimage.metrics import structural_similarity as ssim
    SSIM_AVAILABLE = True
except ImportError:
    SSIM_AVAILABLE = False
    print("WARNING: scikit-image (ssim) is not available. Computer Vision analysis will be mocked.")

app = FastAPI(title="Chalao ML and CV Service")

class DamageAnalysisRequest(BaseModel):
    booking_id: str
    pre_photos: Dict[str, str]
    post_photos: Dict[str, str]

class DynamicPricingRequest(BaseModel):
    renter_age: int
    license_years: int
    has_disputes: bool
    is_verified: bool
    base_price: float
    city: str

def compute_ssim_diff(pre_path: str, post_path: str):
    try:
        if not OPENCV_AVAILABLE or not SSIM_AVAILABLE:
            return None, None
            
        # Resolve path relative to project root or use direct path
        if not os.path.exists(pre_path) or not os.path.exists(post_path):
            return None, None
        
        img1 = cv2.imread(pre_path)
        img2 = cv2.imread(post_path)
        if img1 is None or img2 is None:
            return None, None
        
        # Convert to grayscale
        gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

        # Resize post image to match pre image if they differ
        if gray1.shape != gray2.shape:
            gray2 = cv2.resize(gray2, (gray1.shape[1], gray1.shape[0]))

        # Calculate Structural Similarity Index
        score, diff = ssim(gray1, gray2, full=True)
        diff = (diff * 255).astype("uint8")

        # Threshold difference image to find discrepancy contours
        thresh = cv2.threshold(diff, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
        contours = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]

        flagged_regions = []
        for c in contours:
            area = cv2.contourArea(c)
            if area > 150:  # Threshold to ignore minor noise/lighting diffs
                x, y, w, h = cv2.boundingRect(c)
                flagged_regions.append({
                    "bbox": [int(x), int(y), int(x + w), int(y + h)],
                    "area": float(area),
                    "confidence": 0.90
                })

        return float(score), flagged_regions
    except Exception as e:
        print(f"SSIM Calculation Error: {e}")
        return None, None

@app.post("/api/v1/analyze-damage")
def analyze_damage(payload: DamageAnalysisRequest):
    scores = []
    all_flagged_regions = []
    
    # We compare 6 angles: front, back, left, right, interior, odometer
    angles = ["front", "back", "left", "right", "interior", "odometer"]
    
    for angle in angles:
        pre_file = payload.pre_photos.get(angle)
        post_file = payload.post_photos.get(angle)
        
        if pre_file and post_file:
            score, regions = compute_ssim_diff(pre_file, post_file)
            if score is not None:
                scores.append(score)
                if regions:
                    for r in regions:
                        all_flagged_regions.append({
                            "angle": angle,
                            "bbox": r["bbox"],
                            "confidence": r["confidence"]
                        })
            else:
                # Mock fallback if files cannot be read (to facilitate demo and API robustness)
                scores.append(1.0)
        else:
            scores.append(1.0)
            
    # Calculate global similarity score as average of all available angles
    global_score = float(np.mean(scores)) if scores else 1.0
    
    return {
        "bookingId": payload.booking_id,
        "similarityScore": round(global_score, 4),
        "flaggedRegions": all_flagged_regions,
        "resultImage": None  # Image overlay path can be added in Phase 2
    }

# Placeholder endpoint for dynamic pricing & risk scoring (to be implemented in Phase 5)
@app.post("/api/v1/pricing-and-risk")
def pricing_and_risk(payload: DynamicPricingRequest):
    # Dummy response placeholders to be fully coded in Phase 5
    return {
        "riskScore": 0.15,
        "riskTier": "LOW",
        "suggestedDeposit": payload.base_price * 1.0,
        "dynamicDailyRate": payload.base_price * 1.05
    }

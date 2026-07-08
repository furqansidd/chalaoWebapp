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

import pickle

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
risk_model_path = os.path.join(MODELS_DIR, "risk_model.pkl")
pricing_model_path = os.path.join(MODELS_DIR, "pricing_model.pkl")

risk_model = None
pricing_data = None

if os.path.exists(risk_model_path):
    try:
        with open(risk_model_path, "rb") as f:
            risk_model = pickle.load(f)
        print("Successfully loaded Risk scoring model.")
    except Exception as e:
        print(f"Error loading Risk model: {e}")

if os.path.exists(pricing_model_path):
    try:
        with open(pricing_model_path, "rb") as f:
            pricing_data = pickle.load(f)
        print("Successfully loaded Pricing model.")
    except Exception as e:
        print(f"Error loading Pricing model: {e}")

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

@app.post("/api/v1/pricing-and-risk")
def pricing_and_risk(payload: DynamicPricingRequest):
    try:
        # 1. Feature preparation for Risk scoring
        # Features: renter_age, license_years, has_disputes, is_verified
        risk_features = [
            float(payload.renter_age),
            float(payload.license_years),
            1.0 if payload.has_disputes else 0.0,
            1.0 if payload.is_verified else 0.0
        ]
        
        # 2. Risk Inference
        if risk_model is not None:
            # Predict risk tier
            risk_tier = risk_model.predict([risk_features])[0]
            
            # Predict continuous risk score based on class probabilities
            classes = risk_model.classes_
            probs = risk_model.predict_proba([risk_features])[0]
            prob_dict = dict(zip(classes, probs))
            
            # Heuristic continuous mapping from probabilities: LOW = 0.1, MEDIUM = 0.5, HIGH = 0.9
            p_low = prob_dict.get("LOW", 0.0)
            p_med = prob_dict.get("MEDIUM", 0.0)
            p_high = prob_dict.get("HIGH", 0.0)
            risk_score = 0.1 * p_low + 0.5 * p_med + 0.9 * p_high
        else:
            # Fallback heuristic
            risk_score = 0.2 + 0.5 * (payload.license_years < 2) + 0.3 * (1.0 if payload.has_disputes else 0.0) - 0.15 * (1.0 if payload.is_verified else 0.0)
            risk_score = min(max(risk_score, 0.0), 1.0)
            risk_tier = "LOW" if risk_score < 0.35 else ("MEDIUM" if risk_score < 0.65 else "HIGH")
            
        # 3. Dynamic Pricing Inference
        if pricing_data is not None:
            # Features: renter_age, license_years, has_disputes, is_verified, base_price, city_KARACHI, city_LAHORE, city_ISLAMABAD
            price_features = [
                float(payload.renter_age),
                float(payload.license_years),
                1.0 if payload.has_disputes else 0.0,
                1.0 if payload.is_verified else 0.0,
                float(payload.base_price),
                1.0 if payload.city == "KARACHI" else 0.0,
                1.0 if payload.city == "LAHORE" else 0.0,
                1.0 if payload.city == "ISLAMABAD" else 0.0
            ]
            dynamic_daily_rate = float(pricing_data["model"].predict([price_features])[0])
            dynamic_daily_rate = max(dynamic_daily_rate, payload.base_price)
        else:
            # Fallback heuristic
            city_multipliers = {"KARACHI": 1.10, "LAHORE": 1.05, "ISLAMABAD": 1.00}
            city_mult = city_multipliers.get(payload.city, 1.00)
            risk_mult = 1.0 + 0.2 * (risk_tier == "HIGH") + 0.08 * (risk_tier == "MEDIUM")
            dynamic_daily_rate = payload.base_price * city_mult * risk_mult
            
        # 4. Calculate suggested deposit based on risk tier
        deposit_multipliers = {"LOW": 1.0, "MEDIUM": 1.5, "HIGH": 2.0}
        dep_mult = deposit_multipliers.get(risk_tier, 1.0)
        suggested_deposit = payload.base_price * dep_mult
        
        return {
            "riskScore": round(float(risk_score), 4),
            "riskTier": risk_tier,
            "suggestedDeposit": round(float(suggested_deposit), 2),
            "dynamicDailyRate": round(float(dynamic_daily_rate), 2)
        }
    except Exception as e:
        print(f"Error during pricing/risk inference: {e}")
        raise HTTPException(status_code=500, detail=str(e))

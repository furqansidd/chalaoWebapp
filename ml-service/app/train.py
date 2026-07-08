import os
import pickle
import numpy as np

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    
    # 1. Base User Profile Features
    renter_age = np.random.randint(18, 65, size=num_samples)
    license_years = np.clip(renter_age - np.random.randint(18, 25, size=num_samples), 0, None)
    has_disputes = np.random.choice([0.0, 1.0], size=num_samples, p=[0.85, 0.15])
    is_verified = np.random.choice([0.0, 1.0], size=num_samples, p=[0.20, 0.80])
    base_price = np.random.choice([3000.0, 5000.0, 8000.0, 12000.0, 15000.0], size=num_samples)
    city = np.random.choice(["KARACHI", "LAHORE", "ISLAMABAD"], size=num_samples)
    
    # 2. Derive Ground-Truth Risk Score & Tier
    # Base risk score calculation with logical correlations
    risk_score = 0.2 + 0.5 * (license_years < 2) + 0.3 * has_disputes - 0.15 * is_verified
    # Add random noise
    risk_score += np.random.normal(0, 0.1, size=num_samples)
    risk_score = np.clip(risk_score, 0.0, 1.0)
    
    # Map score to risk tier labels
    risk_tier = []
    for score in risk_score:
        if score < 0.35:
            risk_tier.append("LOW")
        elif score < 0.65:
            risk_tier.append("MEDIUM")
        else:
            risk_tier.append("HIGH")
    
    # 3. Derive Dynamic Daily Rate (Dynamic Pricing)
    city_multipliers = {"KARACHI": 1.10, "LAHORE": 1.05, "ISLAMABAD": 1.00}
    city_mult = np.array([city_multipliers[c] for c in city])
    
    risk_mult = 1.0 + 0.2 * (risk_score > 0.65) + 0.08 * ((risk_score > 0.35) & (risk_score <= 0.65))
    
    dynamic_daily_rate = base_price * city_mult * risk_mult
    # Add small daily rate noise
    dynamic_daily_rate += np.random.normal(0, 150.0, size=num_samples)
    dynamic_daily_rate = np.clip(dynamic_daily_rate, base_price, None)
    
    return {
        "renter_age": renter_age.astype(float),
        "license_years": license_years.astype(float),
        "has_disputes": has_disputes,
        "is_verified": is_verified,
        "base_price": base_price,
        "city": city,
        "risk_score": risk_score,
        "risk_tier": np.array(risk_tier),
        "dynamic_daily_rate": dynamic_daily_rate
    }

def train_and_save_models():
    print("Generating synthetic Pakistani user profiles dataset...")
    data = generate_synthetic_data(1500)
    
    # Create models output directory
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    
    # ----------------------------------------------------
    # Model 1: Renter Risk Scoring (Random Forest Classifier)
    # Features: renter_age, license_years, has_disputes, is_verified
    # Targets: predicts risk_tier ("LOW", "MEDIUM", "HIGH")
    # ----------------------------------------------------
    X_risk = np.column_stack([
        data["renter_age"],
        data["license_years"],
        data["has_disputes"],
        data["is_verified"]
    ])
    y_risk = data["risk_tier"]
    
    from sklearn.ensemble import RandomForestClassifier
    risk_model = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    risk_model.fit(X_risk, y_risk)
    
    # Save Risk Model
    risk_model_path = os.path.join(models_dir, "risk_model.pkl")
    with open(risk_model_path, "wb") as f:
        pickle.dump(risk_model, f)
    print(f"Risk Classifier model saved to {risk_model_path}")
    
    # ----------------------------------------------------
    # Model 2: Dynamic Pricing (Linear Regression)
    # Features: renter_age, license_years, has_disputes, is_verified, base_price, city
    # City is hot-encoded
    # Target: dynamic_daily_rate
    # ----------------------------------------------------
    city_karachi = (data["city"] == "KARACHI").astype(float)
    city_lahore = (data["city"] == "LAHORE").astype(float)
    city_islamabad = (data["city"] == "ISLAMABAD").astype(float)
    
    X_price = np.column_stack([
        data["renter_age"],
        data["license_years"],
        data["has_disputes"],
        data["is_verified"],
        data["base_price"],
        city_karachi,
        city_lahore,
        city_islamabad
    ])
    y_price = data["dynamic_daily_rate"]
    
    from sklearn.linear_model import LinearRegression
    pricing_model = LinearRegression()
    pricing_model.fit(X_price, y_price)
    
    feature_cols = [
        "renter_age", "license_years", "has_disputes", "is_verified", 
        "base_price", "city_KARACHI", "city_LAHORE", "city_ISLAMABAD"
    ]
    
    # Save Pricing Model
    pricing_model_path = os.path.join(models_dir, "pricing_model.pkl")
    with open(pricing_model_path, "wb") as f:
        pickle.dump({
            "model": pricing_model,
            "feature_cols": feature_cols
        }, f)
    print(f"Dynamic Pricing model saved to {pricing_model_path}")

if __name__ == "__main__":
    train_and_save_models()

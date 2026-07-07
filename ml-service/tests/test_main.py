import os
import pytest
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

client = TestClient(app)

def test_analyze_damage_fallback():
    payload = {
        "booking_id": "booking-123",
        "pre_photos": {
            "front": "nonexistent-pre.jpg",
            "back": "nonexistent-pre.jpg"
        },
        "post_photos": {
            "front": "nonexistent-post.jpg",
            "back": "nonexistent-post.jpg"
        }
    }
    
    response = client.post("/api/v1/analyze-damage", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["bookingId"] == "booking-123"
    # Should fallback to perfect similarity (1.0) since images don't exist
    assert data["similarityScore"] == 1.0
    assert data["flaggedRegions"] == []

@pytest.mark.skipif(not OPENCV_AVAILABLE, reason="OpenCV not installed")
def test_analyze_damage_with_real_images(tmp_path):
    # Create two temporary test images
    img1_path = str(tmp_path / "pre.png")
    img2_path = str(tmp_path / "post.png")
    
    # Pre-trip: solid white image
    img1 = np.ones((100, 100, 3), dtype=np.uint8) * 255
    cv2.imwrite(img1_path, img1)
    
    # Post-trip: white image with a black square (damage discrepancy)
    img2 = np.ones((100, 100, 3), dtype=np.uint8) * 255
    img2[30:50, 30:50] = 0 # draw black box damage
    cv2.imwrite(img2_path, img2)
    
    payload = {
        "booking_id": "booking-456",
        "pre_photos": {
            "front": img1_path
        },
        "post_photos": {
            "front": img2_path
        }
    }
    
    response = client.post("/api/v1/analyze-damage", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["bookingId"] == "booking-456"
    # Similarity should be less than 1.0 due to the added black box
    assert data["similarityScore"] < 1.0
    assert len(data["flaggedRegions"]) > 0
    
    # Verify flagged region bounding box matches the drawing location roughly
    flagged = data["flaggedRegions"][0]
    assert flagged["angle"] == "front"
    assert flagged["bbox"] is not None

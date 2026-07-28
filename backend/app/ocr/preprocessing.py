import io
import logging

try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None

class ImagePreprocessor:
    @staticmethod
    def preprocess_image_bytes(image_bytes: bytes):
        if cv2 is not None and np is not None:
            try:
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is not None:
                    return img
            except Exception:
                pass
        if Image is not None:
            try:
                return Image.open(io.BytesIO(image_bytes)).convert("RGB")
            except Exception:
                pass
        return image_bytes

    @staticmethod
    def enhance_for_ocr(img):
        if cv2 is not None and hasattr(img, 'shape'):
            try:
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
                enhanced = clahe.apply(gray)
                return enhanced
            except Exception:
                pass
        return img

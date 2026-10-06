import io
import numpy as np
from PIL import Image, ImageOps

MAX_IMAGE_SIDE = 2000


def bytes_to_pil_image(image_bytes: bytes | Image.Image) -> Image.Image:
    if isinstance(image_bytes, Image.Image):
        img = image_bytes.convert("RGB")
    else:
        img = Image.open(io.BytesIO(image_bytes))
        img = ImageOps.exif_transpose(img).convert("RGB")  # fix phone camera orientation
    img.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE))
    return img


def pil_to_bgr_array(img: Image.Image) -> np.ndarray:
    if not isinstance(img, Image.Image):
        img = bytes_to_pil_image(img)
    return np.array(img)[:, :, ::-1]  # RGB -> BGR


def bytes_to_bgr_array(image_bytes: bytes | Image.Image) -> np.ndarray:
    return pil_to_bgr_array(image_bytes)

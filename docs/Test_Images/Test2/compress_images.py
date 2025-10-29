#!/usr/bin/env python3
from PIL import Image
import os
import glob

# Compress all JPG images in current directory
for filepath in glob.glob("*.jpg"):
    try:
        print(f"Compressing {filepath}...")
        img = Image.open(filepath)

        # Get current size
        width, height = img.size
        original_size = os.path.getsize(filepath) / 1024  # KB

        # Resize if too large (max 1200px width for web)
        if width > 1200:
            new_width = 1200
            new_height = int((new_width / width) * height)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"  Resized from {width}x{height} to {new_width}x{new_height}")

        # Convert to RGB if necessary (remove alpha channel)
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')

        # Save with aggressive compression
        img.save(filepath, 'JPEG', quality=75, optimize=True, progressive=True)

        new_size = os.path.getsize(filepath) / 1024  # KB
        savings = ((original_size - new_size) / original_size) * 100
        print(f"  {original_size:.1f}KB → {new_size:.1f}KB (saved {savings:.1f}%)")

    except Exception as e:
        print(f"  ERROR: {e}")

print("\nAll images compressed!")

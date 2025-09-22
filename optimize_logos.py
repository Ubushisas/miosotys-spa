#!/usr/bin/env python3
from PIL import Image
import os

def optimize_logo(input_path, output_path, max_width=400):
    """Optimize logo images for web"""
    try:
        with Image.open(input_path) as img:
            print(f"Original {input_path}: {img.size}, {os.path.getsize(input_path)/1024:.1f}KB")

            # Calculate new size maintaining aspect ratio
            if img.width > max_width:
                ratio = max_width / img.width
                new_height = int(img.height * ratio)
                img = img.resize((max_width, new_height), Image.LANCZOS)

            # Save with optimization
            img.save(output_path, 'PNG', optimize=True, quality=85)
            print(f"Optimized {output_path}: {img.size}, {os.path.getsize(output_path)/1024:.1f}KB")

    except Exception as e:
        print(f"Error optimizing {input_path}: {e}")

# Optimize logos
logo_dir = "Test_Images/"
logos = [
    "Logo_Myosotis-Blanco.png",
    "Logo_Myosotis-Negro.png"
]

for logo in logos:
    input_path = os.path.join(logo_dir, logo)
    if os.path.exists(input_path):
        optimize_logo(input_path, input_path, max_width=300)

print("Logo optimization complete!")
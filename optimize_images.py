#!/usr/bin/env python3
"""
Image Optimizer for Spa Website
Reduces file sizes while maintaining high quality
"""

import os
import shutil
from PIL import Image
import time
from datetime import datetime

# Configuration
QUALITY_SETTINGS = {
    'jpg': 85,  # High quality JPEG (85-95 is considered high quality)
    'png': True, # PNG optimization
    'max_width': 1920,  # Max width for images (Full HD)
    'max_height': 1920, # Max height for images
    'thumbnail_size': (300, 300)  # For very small images
}

def get_file_size_mb(filepath):
    """Get file size in MB"""
    return os.path.getsize(filepath) / (1024 * 1024)

def create_backup(source_dir):
    """Create a backup of original images"""
    backup_dir = source_dir + "_BACKUP_" + datetime.now().strftime("%Y%m%d_%H%M%S")
    print(f"📁 Creating backup at: {backup_dir}")
    shutil.copytree(source_dir, backup_dir)
    return backup_dir

def optimize_image(input_path, output_path):
    """Optimize a single image"""
    original_size = get_file_size_mb(input_path)

    try:
        # Open image
        with Image.open(input_path) as img:
            # Convert RGBA to RGB if necessary (for JPEG conversion)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create a white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            # Get current dimensions
            width, height = img.size

            # Calculate new dimensions if needed
            max_width = QUALITY_SETTINGS['max_width']
            max_height = QUALITY_SETTINGS['max_height']

            # Only resize if image is larger than max dimensions
            if width > max_width or height > max_height:
                # Calculate aspect ratio
                aspect_ratio = width / height

                if width > height:
                    new_width = min(width, max_width)
                    new_height = int(new_width / aspect_ratio)
                else:
                    new_height = min(height, max_height)
                    new_width = int(new_height * aspect_ratio)

                # Resize with high-quality resampling
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                print(f"  📐 Resized from {width}x{height} to {new_width}x{new_height}")

            # Determine output format based on file extension
            output_ext = os.path.splitext(output_path)[1].lower()

            if output_ext in ['.png']:
                # Save as optimized PNG
                img.save(output_path, 'PNG', optimize=True)
            else:
                # Save as optimized JPEG
                # Change extension to .jpg if it's not already
                if output_ext not in ['.jpg', '.jpeg']:
                    output_path = os.path.splitext(output_path)[0] + '.jpg'

                img.save(output_path, 'JPEG',
                        quality=QUALITY_SETTINGS['jpg'],
                        optimize=True,
                        progressive=True)  # Progressive JPEG for faster web loading

            new_size = get_file_size_mb(output_path)
            reduction = ((original_size - new_size) / original_size) * 100

            return {
                'success': True,
                'original_size': original_size,
                'new_size': new_size,
                'reduction': reduction,
                'output_path': output_path
            }

    except Exception as e:
        print(f"  ❌ Error optimizing {input_path}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'original_size': original_size
        }

def optimize_directory(directory):
    """Optimize all images in a directory recursively"""
    results = {
        'optimized': 0,
        'failed': 0,
        'total_original_size': 0,
        'total_new_size': 0,
        'files': []
    }

    # Get all image files
    image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.JPG', '.JPEG', '.PNG')

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(image_extensions) and not file.startswith('.'):
                input_path = os.path.join(root, file)
                output_path = input_path  # Overwrite original

                print(f"\n🖼️  Processing: {file}")
                result = optimize_image(input_path, output_path)

                if result['success']:
                    results['optimized'] += 1
                    results['total_original_size'] += result['original_size']
                    results['total_new_size'] += result['new_size']
                    print(f"  ✅ Reduced by {result['reduction']:.1f}% ({result['original_size']:.2f}MB → {result['new_size']:.2f}MB)")
                else:
                    results['failed'] += 1

                results['files'].append(result)

    return results

def main():
    """Main function"""
    print("""
╔════════════════════════════════════════════╗
║     🎨 IMAGE OPTIMIZER FOR SPA WEBSITE     ║
║         High Quality + Small Size          ║
╚════════════════════════════════════════════╝
    """)

    source_dir = "/Users/lis/Documents/Website_Portfolio/Spa/Test_Images"

    # Step 1: Create backup
    print("\n📦 STEP 1: Creating backup of original images...")
    print("This ensures you always have the originals safe!")
    backup_dir = create_backup(source_dir)
    print(f"✅ Backup created successfully!\n")

    # Step 2: Optimize images
    print("🚀 STEP 2: Optimizing images...")
    print("This might take a few minutes. Watch the magic happen!\n")

    start_time = time.time()
    results = optimize_directory(source_dir)
    end_time = time.time()

    # Step 3: Show results
    print("\n" + "="*50)
    print("📊 OPTIMIZATION COMPLETE!")
    print("="*50)
    print(f"\n✨ Images Optimized: {results['optimized']}")
    if results['failed'] > 0:
        print(f"⚠️  Failed: {results['failed']}")

    print(f"\n💾 Storage Saved:")
    print(f"   Original Total Size: {results['total_original_size']:.2f} MB")
    print(f"   New Total Size: {results['total_new_size']:.2f} MB")
    print(f"   Space Saved: {results['total_original_size'] - results['total_new_size']:.2f} MB")

    if results['total_original_size'] > 0:
        total_reduction = ((results['total_original_size'] - results['total_new_size']) / results['total_original_size']) * 100
        print(f"   Reduction: {total_reduction:.1f}%")

    print(f"\n⏱️  Time taken: {end_time - start_time:.2f} seconds")

    print(f"\n💼 Backup Location:")
    print(f"   {backup_dir}")
    print("\n✅ Your website will now load MUCH faster!")
    print("🎉 Ready to upload to DigitalOcean!")

    # Create a report file
    report_path = os.path.join(source_dir, "..", "image_optimization_report.txt")
    with open(report_path, 'w') as f:
        f.write("IMAGE OPTIMIZATION REPORT\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"{'='*50}\n\n")
        f.write(f"Images Optimized: {results['optimized']}\n")
        f.write(f"Failed: {results['failed']}\n")
        f.write(f"Original Size: {results['total_original_size']:.2f} MB\n")
        f.write(f"New Size: {results['total_new_size']:.2f} MB\n")
        f.write(f"Space Saved: {results['total_original_size'] - results['total_new_size']:.2f} MB\n")
        if results['total_original_size'] > 0:
            f.write(f"Reduction: {total_reduction:.1f}%\n")
        f.write(f"\nBackup Location: {backup_dir}\n")

    print(f"\n📄 Report saved to: {report_path}")

if __name__ == "__main__":
    main()
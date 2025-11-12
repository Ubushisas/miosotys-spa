#!/bin/bash

echo "🖼️  Miosotis Spa - Image Compression Script"
echo "==========================================="
echo ""

# Check if imagemagick is installed
if ! command -v convert &> /dev/null; then
    echo "📦 ImageMagick not found. Installing..."
    brew install imagemagick
fi

# Ask for source folder
echo "Please drag the 'New-pictures' folder here and press Enter:"
read SOURCE_FOLDER

# Remove quotes if present
SOURCE_FOLDER=$(echo $SOURCE_FOLDER | tr -d "'\"")

# Check if folder exists
if [ ! -d "$SOURCE_FOLDER" ]; then
    echo "❌ Folder not found: $SOURCE_FOLDER"
    exit 1
fi

# Destination folder
DEST_FOLDER="/Users/lis/miosotys-spa/docs/Test_Images/Catalogo/Spa_Individual"

echo ""
echo "📂 Source: $SOURCE_FOLDER"
echo "📂 Destination: $DEST_FOLDER"
echo ""
echo "🔄 Compressing and optimizing images..."
echo ""

# Process each JPG file
for img in "$SOURCE_FOLDER"/*.jpg "$SOURCE_FOLDER"/*.JPG "$SOURCE_FOLDER"/*.jpeg "$SOURCE_FOLDER"/*.JPEG; do
    if [ -f "$img" ]; then
        filename=$(basename "$img")
        echo "  Processing: $filename"

        # Compress and optimize: resize if too large, reduce quality to 85%, strip metadata
        convert "$img" \
            -resize '1920x1920>' \
            -quality 85 \
            -strip \
            "$DEST_FOLDER/$filename"

        # Show file sizes
        original_size=$(du -h "$img" | cut -f1)
        new_size=$(du -h "$DEST_FOLDER/$filename" | cut -f1)
        echo "    Original: $original_size → Compressed: $new_size"
    fi
done

echo ""
echo "✅ Image compression complete!"
echo ""
echo "📋 Processed images saved to:"
echo "   $DEST_FOLDER"
echo ""
echo "🎯 Next steps:"
echo "   1. Review the compressed images"
echo "   2. Test them in the catalog locally"
echo "   3. When ready, we'll commit and deploy to GitHub"

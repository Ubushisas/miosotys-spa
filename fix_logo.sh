#!/bin/bash

# Script to fix logo CSS on DigitalOcean server
echo "Fixing logo CSS on server..."

# Create the fixed CSS content
cat > /tmp/logo_fix.sed << 'EOF'
s/filter: brightness(0) invert(1);//g
EOF

# Apply the fix to the CSS file
sed -i.backup -f /tmp/logo_fix.sed /var/www/html/styles.css

echo "Logo CSS fixed! The filter has been removed."
echo "Backup created at /var/www/html/styles.css.backup"

# Restart Apache to ensure changes take effect
systemctl restart apache2

echo "Apache restarted. Logo should now be visible!"
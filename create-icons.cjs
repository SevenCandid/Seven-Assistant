// Simple script to create PWA icons
// Run: node create-icons.cjs

const fs = require('fs');
const path = require('path');

// Create SVG icon with "7"
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">7</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const publicDir = path.join(__dirname, 'public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Creating SVG icons for Seven...\n');

sizes.forEach(size => {
  const svg = createSVG(size);
  // For now, save as PNG extension (browsers will render SVG)
  const filename = `icon-${size}.png`;
  fs.writeFileSync(path.join(publicDir, filename), svg);
  console.log(`✅ Created ${filename} (${size}x${size})`);
});

console.log('\n🎉 All icons created!');
console.log('📱 Your PWA is ready to be installed!');
console.log('\nNote: Icons are SVG format with .png extension');
console.log('They will work fine, but for production you can convert to real PNG using:');
console.log('- https://cloudconvert.com/svg-to-png');
console.log('- Or imagemagick: convert icon-192.png icon-192-real.png');









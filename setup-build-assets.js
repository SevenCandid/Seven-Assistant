/**
 * Setup Build Assets for Seven AI Assistant
 * Creates folder structure and placeholder files for build assets
 * Run: node setup-build-assets.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildDir = path.join(__dirname, 'build');
const iconsDir = path.join(buildDir, 'icons');

console.log('🎨 Setting up build assets...\n');

// Create directories
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('✅ Created build/ directory');
}

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✅ Created build/icons/ directory');
}

// Create README in build folder
const buildReadme = `# Build Assets

This folder contains assets required for building distributable packages.

## Required Files

### Desktop (Electron)
- \`icon.ico\` - Windows icon (256x256)
- \`icon.icns\` - macOS icon (512x512)
- \`icons/\` - Linux icons (16x16 to 512x512)
- \`dmg-background.png\` - macOS DMG background (540x380, optional)

### Mobile (Capacitor)
- \`splash.png\` - Splash screen (2732x2732)
- Use \`npx @capacitor/assets generate\` to auto-generate from resources/

## How to Generate

### Method 1: Online Tools
- https://realfavicongenerator.net/
- https://icon.kitchen/
- https://www.electronforge.io/guides/create-and-add-icons

### Method 2: Local Generator
- Open http://localhost:5173/generate-icons.html
- Download all icons
- Convert to required formats:
  - \`.ico\` for Windows (use online converter or imagemagick)
  - \`.icns\` for macOS (use online converter or iconutil)

### Method 3: Capacitor Assets (Mobile)
\`\`\`bash
# Install tool
npm install -g @capacitor/assets

# Create resources/ folder with:
# - icon.png (1024x1024, transparent)
# - splash.png (2732x2732)

# Generate
npx @capacitor/assets generate --iconBackgroundColor '#ff7b00'
\`\`\`

## Status
Currently using placeholder assets. Replace with actual Seven branding for production.
`;

fs.writeFileSync(path.join(buildDir, 'README.md'), buildReadme);
console.log('✅ Created build/README.md\n');

// Create placeholder info files for missing assets
const assets = [
  'icon.ico',
  'icon.icns',
  'dmg-background.png',
  'splash.png'
];

let missingAssets = [];

assets.forEach(asset => {
  const assetPath = path.join(buildDir, asset);
  if (!fs.existsSync(assetPath)) {
    missingAssets.push(asset);
  }
});

const iconSizes = [16, 32, 48, 64, 128, 256, 512];
iconSizes.forEach(size => {
  const iconFile = `${size}x${size}.png`;
  const iconPath = path.join(iconsDir, iconFile);
  if (!fs.existsSync(iconPath)) {
    missingAssets.push(`icons/${iconFile}`);
  }
});

if (missingAssets.length > 0) {
  console.log('⚠️  Missing Build Assets:\n');
  missingAssets.forEach(asset => {
    console.log(`   ❌ ${asset}`);
  });
  
  console.log('\n📝 Instructions:\n');
  console.log('   1. Generate icons using online tools:');
  console.log('      → https://realfavicongenerator.net/');
  console.log('      → https://icon.kitchen/\n');
  console.log('   2. Or use local generator:');
  console.log('      → npm run dev');
  console.log('      → Open http://localhost:5173/generate-icons.html');
  console.log('      → Download and convert icons\n');
  console.log('   3. Place assets in build/ folder');
  console.log('   4. Run this script again to verify\n');
  console.log('   ℹ️  Builds will work without icons but won\'t have proper branding\n');
} else {
  console.log('✅ All build assets present!\n');
}

console.log('📂 Build folder structure:');
console.log(`
build/
├── README.md              ✅ Created
├── icon.ico               ${fs.existsSync(path.join(buildDir, 'icon.ico')) ? '✅' : '❌'} Windows icon
├── icon.icns              ${fs.existsSync(path.join(buildDir, 'icon.icns')) ? '✅' : '❌'} macOS icon
├── dmg-background.png     ${fs.existsSync(path.join(buildDir, 'dmg-background.png')) ? '✅' : '⚠️ '} Optional
├── splash.png             ${fs.existsSync(path.join(buildDir, 'splash.png')) ? '✅' : '❌'} Mobile splash
└── icons/                 ${fs.existsSync(iconsDir) ? '✅' : '❌'} Linux icons
    ├── 16x16.png          ${fs.existsSync(path.join(iconsDir, '16x16.png')) ? '✅' : '❌'}
    ├── 32x32.png          ${fs.existsSync(path.join(iconsDir, '32x32.png')) ? '✅' : '❌'}
    ├── 48x48.png          ${fs.existsSync(path.join(iconsDir, '48x48.png')) ? '✅' : '❌'}
    ├── 64x64.png          ${fs.existsSync(path.join(iconsDir, '64x64.png')) ? '✅' : '❌'}
    ├── 128x128.png        ${fs.existsSync(path.join(iconsDir, '128x128.png')) ? '✅' : '❌'}
    ├── 256x256.png        ${fs.existsSync(path.join(iconsDir, '256x256.png')) ? '✅' : '❌'}
    └── 512x512.png        ${fs.existsSync(path.join(iconsDir, '512x512.png')) ? '✅' : '❌'}
`);

console.log('🚀 Setup complete! See build/README.md for details.\n');


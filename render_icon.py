"""App icon: the tree-ring plate logo (logo.png, black on white) turned white, centered on the app's dark background.
Writes icon-1024.png (App Store / Xcode), the web icons in dist/icons/, and the Xcode AppIcon."""
import os
from PIL import Image, ImageChops

BG = (0x11, 0x13, 0x15)
src = Image.open('logo.png').convert('RGBA')
# Black ink becomes white; paper (white or transparent) becomes transparent.
flat = Image.new('RGBA', src.size, (255, 255, 255, 255)); flat.alpha_composite(src)
ink = ImageChops.invert(flat.convert('L'))                      # 255 where the logo is black
ink = ink.crop(ink.getbbox())
mark = Image.new('RGBA', ink.size, (255, 255, 255, 0)); mark.putalpha(ink)

def icon(size, scale):
    """Logo fills `scale` of the square's width (or height, if taller), optically centered."""
    im = Image.new('RGBA', (size, size), BG + (255,))
    w, h = mark.size; k = scale * size / max(w, h)
    m = mark.resize((round(w * k), round(h * k)), Image.LANCZOS)
    im.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    return im.convert('RGB')

big = icon(1024, 0.66); big.save('icon-1024.png')
os.makedirs('dist/icons', exist_ok=True)
for name, s in [('apple-touch-icon.png', 180), ('icon-192.png', 192), ('icon-512.png', 512)]:
    big.resize((s, s), Image.LANCZOS).save('dist/icons/' + name)
icon(1024, 0.52).resize((512, 512), Image.LANCZOS).save('dist/icons/icon-maskable-512.png')  # inside Android's safe zone
xc = 'native/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'
if os.path.isdir(os.path.dirname(xc)): big.save(xc)
print('icons written')

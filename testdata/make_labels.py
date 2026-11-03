"""Makes two Nutrition Facts photos for test_labelread.py: a clean US label and a tilted, dim, blurred one."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import os
D = os.path.dirname(os.path.abspath(__file__))
B = '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed-Bold.ttf'; R = '/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf'
def label():
    W = 620; img = Image.new('RGB', (W, 900), 'white'); d = ImageDraw.Draw(img); _t = d.text; d.text = lambda xy, s, font=None, fill='black': _t(xy, s, font=font, fill=fill)
    f = lambda s, b=False: ImageFont.truetype(B if b else R, s)
    y = 20; d.rectangle([10, 10, W - 10, 880], outline='black', width=3)
    d.text((24, y), 'Nutrition Facts', font=f(58, True), fill='black'); y += 74
    d.text((24, y), '8 servings per container', font=f(24)); y += 34
    d.text((24, y), 'Serving size', font=f(28, True)); d.text((W - 260, y), '2/3 cup (55g)', font=f(28, True)); y += 44
    d.rectangle([24, y, W - 24, y + 12], fill='black'); y += 20
    d.text((24, y), 'Amount per serving', font=f(22, True)); y += 28
    d.text((24, y), 'Calories', font=f(48, True)); d.text((W - 120, y - 6), '230', font=f(56, True)); y += 66
    d.rectangle([24, y, W - 24, y + 6], fill='black'); y += 12
    d.text((W - 190, y), '% Daily Value*', font=f(22, True)); y += 30
    rows = [('Total Fat', '8g', '10%', True, 0), ('Saturated Fat', '1g', '5%', False, 24), ('Trans Fat', '0g', '', False, 24),
            ('Cholesterol', '0mg', '0%', True, 0), ('Sodium', '160mg', '7%', True, 0), ('Total Carbohydrate', '37g', '13%', True, 0),
            ('Dietary Fiber', '4g', '14%', False, 24), ('Total Sugars', '12g', '', False, 24), ('Includes 10g Added Sugars', '', '20%', False, 44),
            ('Protein', '3g', '', True, 0)]
    for name, amt, pct, bold, ind in rows:
        d.line([24, y, W - 24, y], fill='black', width=1); y += 6
        d.text((24 + ind, y), name, font=f(28, bold)); w = d.textlength(name, font=f(28, bold))
        if amt: d.text((24 + ind + w + 10, y), amt, font=f(28))
        if pct: d.text((W - 90, y), pct, font=f(28, True))
        y += 40
    d.rectangle([24, y, W - 24, y + 12], fill='black')
    return img
img = label(); img.save(os.path.join(D, 'label-clean.jpg'), quality=88)
ph = Image.new('RGB', (1500, 1900), (196, 186, 170)); lab = label().resize((1240, 1800)).rotate(3, expand=True, fillcolor=(196, 186, 170))
ph.paste(lab, (60, 20)); ph = ImageEnhance.Brightness(ph).enhance(0.8).filter(ImageFilter.GaussianBlur(1.4))
ph.save(os.path.join(D, 'label-photo.jpg'), quality=80)

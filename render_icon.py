import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image
async def main():
    svg = open('icon.svg').read()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1024,'height':1024})
        await pg.set_content(f'<html><body style="margin:0">{svg}</body></html>')
        await pg.screenshot(path='icon-1024.png', clip={'x':0,'y':0,'width':1024,'height':1024})
        await b.close()
    im = Image.open('icon-1024.png').convert('RGB')
    for name, s in [('apple-touch-icon.png',180),('icon-192.png',192),('icon-512.png',512)]:
        im.resize((s,s), Image.LANCZOS).save('dist/icons/'+name)
    # maskable: shrink artwork into the safe zone (80%) on the same background
    m = Image.new('RGB',(1024,1024),(0x11,0x13,0x15)); inner = im.resize((820,820), Image.LANCZOS); m.paste(inner,(102,102))
    m.resize((512,512), Image.LANCZOS).save('dist/icons/icon-maskable-512.png')
asyncio.run(main())

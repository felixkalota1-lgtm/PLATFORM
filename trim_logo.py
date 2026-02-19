from PIL import Image
import sys

try:
    logo_path = r'C:\Users\Administrator\Platform Sales & Procurement\public\mtrx-logo.jpg'
    print(f"Opening: {logo_path}", file=sys.stderr)
    
    img = Image.open(logo_path)
    print(f"Image size: {img.size}", file=sys.stderr)
    
    img = img.convert('RGBA')
    
    # Convert black/dark pixels to transparent
    pixels = img.load()
    for y in range(img.size[1]):
        for x in range(img.size[0]):
            r, g, b, a = pixels[x, y]
            # If pixel is very dark (close to black), make it transparent
            if r < 30 and g < 30 and b < 30:
                pixels[x, y] = (255, 255, 255, 0)
    
    # Autocrop to content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print(f"Cropped to: {img.size}", file=sys.stderr)
    
    # Save as PNG with transparency
    output_png = logo_path.replace('.jpg', '.png')
    img.save(output_png, 'PNG')
    print(f"Saved PNG: {output_png}", file=sys.stderr)
    
    # Save as JPG with white background
    img_rgb = Image.new('RGB', img.size, 'white')
    img_rgb.paste(img, (0, 0), img)
    img_rgb.save(logo_path, 'JPEG', quality=95)
    print(f"Updated JPG: {logo_path}", file=sys.stderr)
    
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)

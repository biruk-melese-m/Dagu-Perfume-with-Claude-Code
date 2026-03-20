
import re
import json

def clean_name(name):
    # Split by newline first
    lines = [l.strip() for l in name.split('\n') if l.strip()]
    if not lines: return ""
    
    # Try to find a good name in the first 2 lines
    for line in lines[:2]:
        # Remove emojis and special chars
        cleaned = re.sub(r'[^\w\s\-\.&#;]', '', line).strip()
        # If it's a decent length and doesn't sound like a price or size
        if 3 < len(cleaned) < 50 and not re.search(r'^\d+$', cleaned):
            return cleaned
            
    return lines[0][:40].strip()

def get_brand(name, full_text):
    brands = ['Dior', 'Chanel', 'Lattafa', 'Tom Ford', 'YSL', 'Armani', 'Versace', 'Creed', 'Baccarat', 'Maison', 'Afnan', 'Rasasi', 'Al Zaafaran', 'Hugo Boss', 'Gucci', 'Prada', 'Valentino']
    for b in brands:
        if b.lower() in full_text.lower():
            return b
    # Else first word of name
    return name.split(' ')[0]

def extract_price(text):
    # Priority 1: "Price: XXXX"
    price_match = re.search(r'Price[:\s]*([\d,]{3,})', text, re.I)
    if price_match:
        val = price_match.group(1).replace(',', '')
        if val.isdigit() and int(val) > 100:
            return int(val)
    
    # Priority 2: "XXXX Br"
    br_match = re.search(r'([\d,]{3,})\s*Br', text, re.I)
    if br_match:
        val = br_match.group(1).replace(',', '')
        if val.isdigit() and int(val) > 100:
            return int(val)
            
    return None

def process_files():
    files = ['messages.html', 'messages2.html']
    all_products = []
    seen_photos = set()
    
    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except: continue
            
        messages = re.split(r'<div class="message[^"]*" id="message[^"]*">', content)
        
        for msg in messages:
            photo_match = re.search(r'<a class="photo_wrap[^"]*" href="(photos/photo_[^"]*\.jpg)">', msg)
            photo = photo_match.group(1) if photo_match else None
            
            if not photo or photo in seen_photos:
                continue
            
            text_match = re.search(r'<div class="text">(.*?)</div>', msg, re.DOTALL)
            if not text_match:
                continue
            
            text_raw = text_match.group(1)
            text = re.sub(r'<[^>]+>', '\n', text_raw).strip()
            
            name = clean_name(text)
            if len(name) < 3: continue
            
            price = extract_price(text)
            
            text_lower = text.lower()
            gender = 'u'
            if "women" in text_lower or "for her" in text_lower or "ladies" in text_lower:
                gender = 'w'
            elif "men" in text_lower or "for him" in text_lower or "kings" in text_lower:
                gender = 'm'
            
            sec = "sec-unisex"
            if gender == 'm': sec = "sec-kings"
            elif gender == 'w': sec = "sec-queens"
            
            if "oud" in text_lower or "arabian" in text_lower: sec = "sec-oud"
            elif "fresh" in text_lower or "aquatic" in text_lower: sec = "sec-fresh"
            elif "woody" in text_lower or "leather" in text_lower: sec = "sec-woody"
            elif "sweet" in text_lower or "gourmand" in text_lower: sec = "sec-sweet"
            elif "original" in text_lower: sec = "sec-designer"
            
            tags = []
            for t in ['oud', 'fresh', 'aquatic', 'woody', 'leather', 'sweet', 'gourmand', 'floral', 'spicy', 'fruity']:
                if t in text_lower: tags.append(t)
            if not tags: tags = ['misc']
            
            size = "100ml"
            size_match = re.search(r'(\d+ml)', text_lower)
            if size_match: size = size_match.group(1)

            # Vibe - first 3 lines or so
            vibe_lines = [l.strip() for l in text.split('\n') if l.strip()]
            vibe = " ".join(vibe_lines[:3]) if len(vibe_lines) >=3 else text
            if len(vibe) > 150: vibe = vibe[:147] + "..."

            all_products.append({
                "no": 0,
                "brand": get_brand(name, text),
                "name": name,
                "vibe": vibe,
                "sec": sec,
                "g": gender,
                "size": size,
                "orig": "original" in text_lower or "originally" in text_lower,
                "tags": tags,
                "price": str(price) if price else "N/A", # Ensure price is string for consistency or handle in UI
                "image": photo
            })
            seen_photos.add(photo)

    all_products.sort(key=lambda x: x['image'])
    for i, p in enumerate(all_products):
        p['no'] = i + 1
        
    return all_products

products = process_files()
js_content = "const ALL = " + json.dumps(products, indent=2) + ";"
with open('master-data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

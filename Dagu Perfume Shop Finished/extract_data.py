
import re
import os
import json

def extract_data_simple(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by message div
    messages = re.split(r'<div class="message[^"]*" id="message[^"]*">', content)
    results = []
    
    for msg in messages:
        # Extract photo
        photo_match = re.search(r'<a class="photo_wrap[^"]*" href="(photos/photo_[^"]*\.jpg)">', msg)
        photo_path = photo_match.group(1) if photo_match else None
        
        # Extract text
        text_match = re.search(r'<div class="text">(.*?)</div>', msg, re.DOTALL)
        if not text_match:
            continue
            
        text_raw = text_match.group(1)
        # Remove HTML tags from text
        text = re.sub(r'<[^>]+>', ' ', text_raw).strip()
        
        # If no photo in this message, we might need to look ahead or behind? 
        # But usually in Telegram export the photo is in the same message or right before/after.
        
        lines = [l.strip() for l in text.split('  ') if l.strip()] # Split by double space often used between lines after tag removal
        if not lines:
            lines = [text[:50]]
            
        name = lines[0]
        price = "N/A"
        
        # Price extraction
        # Look for "Price" followed by numbers
        price_match = re.search(r'Price[:\s]*([\d,]+)', text, re.I)
        if price_match:
            price = price_match.group(1).replace(',', '')
            
        if photo_path or price != "N/A":
            results.append({
                'name': name,
                'price': price,
                'photo': photo_path,
                'text': text[:200]
            })
    
    return results

data1 = extract_data_simple('messages.html')
data2 = extract_data_simple('messages2.html')
all_data = data1 + data2

# Dedup by photo or name
unique_data = {}
for item in all_data:
    key = item['photo'] if item['photo'] else item['name']
    if key not in unique_data:
        unique_data[key] = item
    else:
        # If duplicate, prefer the one with more info
        if item['photo'] and not unique_data[key]['photo']:
             unique_data[key] = item

results_list = list(unique_data.values())

with open('extracted_perfumes.json', 'w', encoding='utf-8') as f:
    json.dump(results_list, f, indent=2)

print(f"Extracted {len(results_list)} potential perfumes.")

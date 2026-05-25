import requests
import os
import json
import re
from pathlib import Path

def fix_and_load_json(json_file="data.json"):    
    with open(json_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    fixed_lines = []
    
    for i, line in enumerate(lines, 1):
        fixed_lines.append(line)
    
    fixed_content = '\n'.join(fixed_lines)
    
    try:
        data = json.loads(fixed_content)
        return data
    except json.JSONDecodeError as e:
        print(f"Błąd po naprawie: {e}")
        print(f"Problem w linii: {e.lineno}, pozycja: {e.colno}")
        # Pokaż fragment z błędem
        lines = fixed_content.split('\n')
        if e.lineno <= len(lines):
            print(f"Linia z błędem: {lines[e.lineno-1][:200]}")
        return None

def download_thumbnails(results, output_folder="zabka_thumbnails"):    
    if not results:
        print("Brak danych do pobrania")
        return
    
    Path(output_folder).mkdir(parents=True, exist_ok=True)
    
    successful = 0
    failed = 0
    
    print(f"Znaleziono {len(results)} elementów do pobrania")
    print(f"Folder docelowy: {output_folder}")
    print("-" * 60)
    
    for idx, item in enumerate(results, 1):
        thumbnail_url = item.get('original')
        
        if not thumbnail_url:
            print(f"[{idx}/{len(results)}] Brak URL thumbnaila")
            failed += 1
            continue
        
        title = item.get('title', f'image_{idx}')
        safe_title = re.sub(r'[^\w\s-]', '', title)[:50].strip()
        if not safe_title:
            safe_title = f"position_{item.get('position', idx)}"
        
        ext = '.jpg'
        if 'png' in thumbnail_url.lower():
            ext = '.png'
        elif 'webp' in thumbnail_url.lower():
            ext = '.webp'
        
        position = item.get('position', idx)
        filename = f"{position:04d}_{safe_title}{ext}"
        filepath = os.path.join(output_folder, filename)
        
        try:
            print(f"[{idx}/{len(results)}] ⬇️  {safe_title[:40]}...")
            
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(thumbnail_url, headers=headers, timeout=10)
            response.raise_for_status()
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            file_size = len(response.content)
            print(f"    {filename} ({file_size:,} bytes)")
            successful += 1
            
        except Exception as e:
            print(f"    ❌ Błąd: {e}")
            failed += 1
    
    print("-" * 60)
    print(f"\nPobrano: {successful}/{len(results)}")
    print(f"Nieudanych: {failed}")
    print(f"Folder: {os.path.abspath(output_folder)}")

if __name__ == "__main__":
    data = fix_and_load_json("data.json")
    
    if data:
        # Pobierz listę images_results
        if isinstance(data, dict) and 'images_results' in data:
            results = data['images_results']
        else:
            results = data
        
        download_thumbnails(results, "biedronka_obrazy3")
    else:
        print("Nie udało się wczytać danych")
#!/usr/bin/env python3
"""Parse unique_faces.md and extract person data for the website."""
import re
import json
import os

def parse_unique_faces(md_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by --- separator
    sections = content.split('---')
    
    people = []
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
            
        # Extract name from first heading
        name_match = re.search(r'^#\s+(.+)$', section, re.MULTILINE)
        if not name_match:
            continue
        name = name_match.group(1).strip()
        
        # Extract profile picture filename (face-X.jpg from unique_faces_md)
        profile_match = re.search(r'!\[Profile Picture\]\((face-\d+\.jpg)\)', section)
        profile_pic = profile_match.group(1) if profile_match else None
        
        # Extract all image paths
        # Pattern: `C:\Users\RyanV\Documents\photobooth_customs\filename.jpg`
        image_paths = re.findall(r'`C:\\Users\\RyanV\\Documents\\photobooth_customs\\([^`]+)`', section)
        
        # Clean up image paths (just the filename)
        image_filenames = [os.path.basename(path) for path in image_paths]
        
        # Remove duplicates while preserving order
        seen = set()
        unique_images = []
        for img in image_filenames:
            if img not in seen:
                seen.add(img)
                unique_images.append(img)
        
        # Profile pic is in unique_faces_md folder
        profile_pic_final = profile_pic if profile_pic else (unique_images[0] if unique_images else '')
        
        people.append({
            'name': name,
            'profile_pic': profile_pic_final,
            'images': unique_images
        })
    
    return people

if __name__ == '__main__':
    md_path = 'face_sorter/static/unique_faces_md/unique_faces.md'
    people = parse_unique_faces(md_path)
    
    # Output as JavaScript module
    output_path = 'face_sorter/static/data.js'
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('const peopleData = ')
        json.dump(people, f, indent=2)
        f.write(';\n')
    
    print(f"Parsed {len(people)} people")
    print(f"Written to {output_path}")
    
    # Print summary
    for p in people[:5]:
        print(f"  {p['name']}: profile={p['profile_pic']}, images={len(p['images'])}")
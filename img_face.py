import os
import glob
from pathlib import Path
from collections import defaultdict
import numpy as np
import cv2
from tqdm import tqdm
from sklearn.cluster import DBSCAN
import insightface
from insightface.app import FaceAnalysis

def process_image_directory(input_dir: str, output_dir: str, eps: float = 0.6, min_samples: int = 1):
    """
    Detects faces in JPEG images, clusters unique identities, crops profile pictures
    for each unique identity, and generates a single Markdown file listing all persons.
    
    :param input_dir: Path to directory containing JPEG images.
    :param output_dir: Path to directory where unique_faces.md and face-X.jpg files will be saved.
    :param eps: DBSCAN distance threshold (lower = stricter identity matching).
    :param min_samples: Minimum detections to form a cluster.
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # 1. Initialize InsightFace FaceAnalysis App
    app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
    app.prepare(ctx_id=0, det_size=(640, 640))

    print("Initialised...")

    # 2. Collect all JPEG files
    extensions = ('*.jpg', '*.jpeg', '*.JPG', '*.JPEG')
    image_paths = []
    for ext in extensions:
        image_paths.extend(input_path.glob(ext))
    
    image_paths = sorted(list(set(image_paths)))
    if not image_paths:
        print(f"No JPEG images found in {input_dir}")
        return

    print(f"Found {len(image_paths)} images. Detecting and extracting facial embeddings...")

    face_records = []  # Stores face metadata, bounding box, and embedding

    # 3. Detect faces & extract embeddings + bounding boxes
    for img_path in tqdm(image_paths, desc="Processing Images"):
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        
        faces = app.get(img)
        
        for face in faces:
            # Normalized embedding vector (512-dim)
            embedding = face.embedding / np.linalg.norm(face.embedding)
            
            # Extract and clip bounding box coordinates to image dimensions
            bbox = face.bbox.astype(int)
            h, w, _ = img.shape
            x1, y1 = max(0, bbox[0]), max(0, bbox[1])
            x2, y2 = min(w, bbox[2]), min(h, bbox[3])

            face_records.append({
                'filepath': str(img_path.resolve()),
                'embedding': embedding,
                'bbox': (x1, y1, x2, y2)
            })

    if not face_records:
        print("No faces detected across all images.")
        return

    print(f"Extracted {len(face_records)} total face instances. Clustering unique identities...")

    # 4. Cluster face embeddings using DBSCAN
    embeddings = np.array([r['embedding'] for r in face_records])
    clustering = DBSCAN(eps=eps, min_samples=min_samples, metric='cosine')
    labels = clustering.fit_predict(embeddings)

    # Group face instances by cluster label
    clusters = defaultdict(list)
    for record, label in zip(face_records, labels):
        if label != -1:
            clusters[label].append(record)
        else:
            unique_noise_id = f"noise_{id(record)}"
            clusters[unique_noise_id].append(record)

    print(f"Identified {len(clusters)} unique individual face(s). Cropping profile pictures & generating single Markdown file...")

    # Path to the single output Markdown file
    md_filename = output_path / "unique_faces.md"

    # 5. Crop profile pictures and write single Markdown file
    with open(md_filename, 'w', encoding='utf-8') as f:
        for idx, (cluster_id, records) in enumerate(clusters.items(), start=1):
            person_label = f"face-{idx}"
            profile_img_filename = f"{person_label}.jpg"
            profile_img_path = output_path / profile_img_filename

            # --- Generate Profile Picture (using the first instance) ---
            first_record = records[0]
            source_img = cv2.imread(first_record['filepath'])
            if source_img is not None:
                x1, y1, x2, y2 = first_record['bbox']
                crop = source_img[y1:y2, x1:x2]
                if crop.size > 0:
                    cv2.imwrite(str(profile_img_path), crop)

            # Collect unique image file paths containing this face
            unique_filepaths = sorted(list({r['filepath'] for r in records}))

            # --- Append Person Section to Markdown ---
            f.write(f"# Person Identity {idx}\n\n")
            
            if profile_img_path.exists():
                f.write(f"![Profile Picture]({profile_img_filename})\n\n")
            
            f.write(f"Total photos appeared in: **{len(unique_filepaths)}**\n\n")

            for filepath in unique_filepaths:
                f.write(f"### Image Path\n")
                f.write(f"`{filepath}`\n\n")
                f.write(f"![image]({filepath})\n\n")
            
            # Separator between person sections
            f.write("\n---\n\n")

    print(f"Successfully saved profile pictures and consolidated report to '{md_filename}'.")

if __name__ == "__main__":
    INPUT_DIRECTORY = "C:/Users/RyanV/Documents/photobooth_customs"
    OUTPUT_DIRECTORY = "./unique_faces_md"
    
    process_image_directory(
        input_dir=INPUT_DIRECTORY,
        output_dir=OUTPUT_DIRECTORY,
        eps=0.55
    )
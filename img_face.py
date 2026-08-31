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
    Detects faces in JPEG images, clusters unique identities robust to 3D rotation/expression,
    and generates Markdown files listing where each unique face appears.
    
    :param input_dir: Path to directory containing JPEG images.
    :param output_dir: Path to directory where face-X.md files will be saved.
    :param eps: DBSCAN distance threshold (lower = stricter identity matching, default ~0.6 for cosine).
    :param min_samples: Minimum detections to form a cluster (1 ensures single-appearance faces are kept).
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # 1. Initialize InsightFace FaceAnalysis App
    # Uses ONNX runtime under the hood; will automatically utilize CUDA if available.
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

    face_records = []  # Stores tuple of (image_filepath, embedding)

    # 3. Detect faces & extract embeddings
    for img_path in tqdm(image_paths, desc="Processing Images"):
        # Read image using OpenCV
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        
        # Detect faces (robust to rotation & expressions)
        faces = app.get(img)
        
        for face in faces:
            # Normalized embedding vector (512-dim)
            embedding = face.embedding / np.linalg.norm(face.embedding)
            face_records.append({
                'filepath': str(img_path.resolve()),
                'embedding': embedding
            })

    if not face_records:
        print("No faces detected across all images.")
        return

    print(f"Extracted {len(face_records)} total face instances. Clustering unique identities...")

    # 4. Cluster face embeddings using DBSCAN with Cosine Distance
    embeddings = np.array([r['embedding'] for r in face_records])
    
    # Cosine distance = 1 - cosine_similarity. 
    # ArcFace threshold typically sits around 0.4 to 0.6 distance.
    clustering = DBSCAN(eps=eps, min_samples=min_samples, metric='cosine')
    labels = clustering.fit_predict(embeddings)

    # Group image paths by cluster ID
    clusters = defaultdict(set)  # Use set to avoid duplicate image entries per person
    for record, label in zip(face_records, labels):
        if label != -1:  # -1 represents noise/unclustered in DBSCAN (if min_samples > 1)
            clusters[label].add(record['filepath'])
        else:
            # Handle noise as unique individual faces if needed
            unique_noise_id = f"noise_{id(record)}"
            clusters[unique_noise_id].add(record['filepath'])

    print(f"Identified {len(clusters)} unique individual face(s). Generating Markdown files...")

    # 5. Generate Markdown files
    for idx, (cluster_id, filepaths) in enumerate(clusters.items(), start=1):
        md_filename = output_path / f"face-{idx}.md"
        sorted_paths = sorted(list(filepaths))

        with open(md_filename, 'w', encoding='utf-8') as f:
            f.write(f"# Person Identity {idx}\n\n")
            f.write(f"Total photos appeared in: **{len(sorted_paths)}**\n\n")
            f.write("--- \n\n")

            for filepath in sorted_paths:
                f.write(f"### Image Path\n")
                f.write(f"`{filepath}`\n\n")
                f.write(f"![image]({filepath})\n\n")
                f.write("---\n\n")

    print(f"Successfully generated {len(clusters)} Markdown output files in '{output_dir}'.")

if __name__ == "__main__":
    # Example Usage:
    INPUT_DIRECTORY = "C:/Users/RyanV/Documents/photobooth_customs"
    OUTPUT_DIRECTORY = "./unique_faces_md"
    
    process_image_directory(
        input_dir=INPUT_DIRECTORY,
        output_dir=OUTPUT_DIRECTORY,
        eps=0.55  # Adjust between 0.45 (strict) and 0.65 (loose) if needed
    )

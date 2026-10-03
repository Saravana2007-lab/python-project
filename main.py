from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib

app = Flask(__name__)
CORS(app)


# ===========================================================
# FILE TYPE DEFINITIONS
# ===========================================================

IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif",
    ".webp", ".bmp", ".svg"
}

VIDEO_EXTENSIONS = {
    ".mp4", ".mkv", ".avi",
    ".mov", ".wmv", ".webm",".App"
}

DOCUMENT_EXTENSIONS = {
    ".pdf", ".doc", ".docx",
    ".txt", ".rtf", ".odt"
}


# ============================================================
# DUPLICATE DETECTION
# ============================================================
    
def calculate_hash(file_path):

    hash_object = hashlib.sha256()

    with open(file_path, "rb") as file:

        while True:

            chunk = file.read(1024 * 1024)

            if not chunk:
                break

            hash_object.update(chunk)

    return hash_object.hexdigest()


def find_duplicate_candidates(folder_path):

    folder = Path(folder_path)

    files_by_size = {}

    for item in folder.rglob("*"):

        if item.is_file():

            file_size = item.stat().st_size

            if file_size not in files_by_size:
                files_by_size[file_size] = []

            files_by_size[file_size].append(item)

    duplicate_candidates = []

    for file_size, files in files_by_size.items():

        if len(files) > 1:

            duplicate_candidates.append({
                "size": file_size,
                "files": files
            })

    return duplicate_candidates


def find_duplicates(folder_path):

    candidates = find_duplicate_candidates(folder_path)

    duplicate_groups = []

    for candidate in candidates:

        files = candidate["files"]

        files_by_hash = {}

        for file_path in files:

            file_hash = calculate_hash(file_path)

            if file_hash not in files_by_hash:
                files_by_hash[file_hash] = []

            files_by_hash[file_hash].append(file_path)

        for file_hash, matching_files in files_by_hash.items():

            if len(matching_files) > 1:

                duplicate_groups.append({
                    "size": candidate["size"],
                    "files": [
                        str(file_path)
                        for file_path in matching_files
                    ]
                })

    return duplicate_groups


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def format_size(size):

    if size < 1024:
        return f"{size} B"

    elif size < 1024 ** 2:
        return f"{size / 1024:.2f} KB"

    elif size < 1024 ** 3:
        return f"{size / (1024 ** 2):.2f} MB"

    else:
        return f"{size / (1024 ** 3):.2f} GB"


# ============================================================
# FOLDER SCANNING
# ============================================================

def scan_folder(folder_path):

    folder = Path(folder_path)

    file_count = 0
    total_size = 0
    file_types = set()
    empty_files = 0

    image_count = 0
    video_count = 0
    document_count = 0

    for item in folder.rglob("*"):

        if item.is_file():

            file_count += 1

         
            file_size = item.stat().st_size
         
            total_size += file_size

            if file_size == 0:
                empty_files += 1

            extension = item.suffix.lower()

            if extension in IMAGE_EXTENSIONS:
                image_count += 1

            elif extension in VIDEO_EXTENSIONS:
                video_count += 1

            elif extension in DOCUMENT_EXTENSIONS:
                document_count += 1

            if extension:
                file_types.add(extension)

    duplicates = find_duplicates(folder_path)
    large_files = find_large_files(folder_path)

    return {
        "file_count": file_count,
        "total_size": total_size,
        "total_size_formatted": format_size(total_size),
        "file_types": len(file_types),
        "empty_files": empty_files,
        "image_count": image_count,
        "video_count": video_count,
        "document_count": document_count,
        "duplicate_groups": duplicates,
        "large_files": large_files
    }


# ============================================================
# LARGE FILE DETECTION
# ============================================================

LARGE_FILE_SIZE = 500 * 1024 * 1024

def find_large_files(folder_path):

    folder = Path(folder_path)

    large_files = []

    for item in folder.rglob("*"):

        if item.is_file():

            file_size = item.stat().st_size

            if file_size > LARGE_FILE_SIZE:

                large_files.append({
                    "path": str(item),
                    "size": file_size
                })

    return large_files


# ============================================================
# API ENDPOINT
# ============================================================

@app.route("/scan", methods=["POST"])
def scan():

    data = request.get_json()
 
    folder_path = data.get("folder_path")


    if not folder_path:

        return jsonify({
            "error": "Folder path is required."
        }), 400

  
    folder = Path(folder_path)


    if not folder.exists():

        return jsonify({
            "error": "Folder does not exist."
        }), 400


    if not folder.is_dir():

        return jsonify({
            "error": "Path is not a folder."
        }), 400


    results = scan_folder(folder_path)

    return jsonify(results)

# ============================================================
# APPLICATION START
# ============================================================

if __name__ == "__main__":

    app.run(debug=True)

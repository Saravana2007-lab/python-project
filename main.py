from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


def format_size(size):
    if size < 1024:
        return f"{size} B"

    elif size < 1024 ** 2:
        return f"{size / 1024:.2f} KB"

    elif size < 1024 ** 3:
        return f"{size / (1024 ** 2):.2f} MB"

    else:
        return f"{size / (1024 ** 3):.2f} GB"


def scan_folder(folder_path):

    folder = Path(folder_path)

    file_count = 0
    total_size = 0
    file_types = set()
    empty_files = 0

    for item in folder.rglob("*"):

        if item.is_file():

            file_count += 1

            file_size = item.stat().st_size

            total_size += file_size

            if file_size == 0:
                empty_files += 1

            extension = item.suffix.lower()

            if extension:
                file_types.add(extension)


    return {
        "file_count": file_count,
        "total_size": total_size,
        "total_size_formatted": format_size(total_size),
        "file_types": len(file_types),
        "empty_files": empty_files
    }


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


if __name__ == "__main__":

    app.run(debug=True)
    
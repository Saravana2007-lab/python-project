function formatSize(bytes) {

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + " KB";
    }

    if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    }

    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}


const folderInput = document.getElementById("folderPath");
const scanButton = document.getElementById("scanButton");
const scanStatus = document.getElementById("scanStatus");


// ============================================================
// SCAN
// ============================================================

scanButton.addEventListener("click", async function () {

    const folderPath = folderInput.value.trim();


    if (folderPath === "") {

        alert("Please enter a folder path.");

        return;
    }


    scanButton.textContent = "Scanning...";
    scanButton.disabled = true;

    scanStatus.textContent = "Scanning folder...";


    try {

        const response = await fetch(
            "http://127.0.0.1:5000/scan",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    folder_path: folderPath
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Scan failed."
            );
        }


        console.log("Scan results:", data);


        // ====================================================
        // BASIC STATISTICS
        // ====================================================

        document.getElementById("fileCount").textContent =
            data.file_count;

        document.getElementById("totalStorage").textContent =
            data.total_size_formatted;

        document.getElementById("fileTypes").textContent =
            data.file_types;

        document.getElementById("emptyCount").textContent =
            data.empty_files;


        // ====================================================
        // FILE TYPES
        // ====================================================

        document.getElementById("imageCount").textContent =
            data.image_count;

        document.getElementById("videoCount").textContent =
            data.video_count;

        document.getElementById("documentCount").textContent =
            data.document_count;


        // ====================================================
        // DUPLICATES
        // ====================================================

        renderDuplicates(data.duplicate_groups);


        // ====================================================
        // LARGE FILES
        // ====================================================

        renderLargeFiles(data.large_files);


        // ====================================================
        // STATUS
        // ====================================================

        scanStatus.textContent =
            "Scan completed successfully.";

    }


    catch (error) {

        console.error("Scan failed:", error);

        scanStatus.textContent =
            "Scan failed: " + error.message;

    }


    finally {

        scanButton.textContent = "Scan →";
        scanButton.disabled = false;

    }

});


// ============================================================
// RENDER DUPLICATES
// ============================================================

function renderDuplicates(duplicateGroups) {

    const duplicateList =
        document.getElementById("duplicateList");


    const duplicateCount =
        document.getElementById("duplicateCount");


    duplicateList.innerHTML = "";


    duplicateCount.textContent =
        duplicateGroups.length;


    // --------------------------------------------------------
    // NO DUPLICATES
    // --------------------------------------------------------

    if (duplicateGroups.length === 0) {

        duplicateList.innerHTML =
            '<p class="no-duplicates">No duplicates found.</p>';

        return;
    }


    // --------------------------------------------------------
    // DUPLICATE GROUPS
    // --------------------------------------------------------

    duplicateGroups.forEach(function (group, index) {

        const groupElement =
            document.createElement("div");

        groupElement.className =
            "duplicate-group";


        // ----------------------------------------------------
        // HEADER
        // ----------------------------------------------------

        const header =
            document.createElement("div");

        header.className =
            "duplicate-header";


        const title =
            document.createElement("span");

        title.textContent =
            "Group " + (index + 1);


        const info =
            document.createElement("span");

        info.textContent =
            group.files.length +
            " files • " +
            formatSize(group.size);


        header.appendChild(title);
        header.appendChild(info);


        // ----------------------------------------------------
        // FILE CONTAINER
        // ----------------------------------------------------

        const filesContainer =
            document.createElement("div");

        filesContainer.className =
            "duplicate-files";


        // Start collapsed

        filesContainer.style.display =
            "none";


        // ----------------------------------------------------
        // FILES
        // ----------------------------------------------------

        group.files.forEach(function (filePath) {

            const fileElement =
                document.createElement("div");

            fileElement.className =
                "duplicate-file";


            fileElement.textContent =
                filePath;


            filesContainer.appendChild(
                fileElement
            );

        });


        // ----------------------------------------------------
        // CLICK TO EXPAND
        // ----------------------------------------------------

        header.addEventListener(
            "click",
            function () {

                if (
                    filesContainer.style.display ===
                    "none"
                ) {

                    filesContainer.style.display =
                        "block";

                } else {

                    filesContainer.style.display =
                        "none";

                }

            }
        );


        groupElement.appendChild(header);

        groupElement.appendChild(
            filesContainer
        );


        duplicateList.appendChild(
            groupElement
        );

    });

}


// ============================================================
// RENDER LARGE FILES
// ============================================================

function renderLargeFiles(largeFiles) {

    const largeFileList =
        document.getElementById("largeFileList");


    const largeFileCount =
        document.getElementById("largeFileCount");


    largeFileList.innerHTML = "";


    largeFileCount.textContent =
        largeFiles.length;


    // --------------------------------------------------------
    // NO LARGE FILES
    // --------------------------------------------------------

    if (largeFiles.length === 0) {

        largeFileList.innerHTML =
            '<p class="no-large-files">No large files found.</p>';

        return;
    }


    // --------------------------------------------------------
    // LARGE FILES
    // --------------------------------------------------------

    largeFiles.forEach(function (file) {

        const fileElement =
            document.createElement("div");

        fileElement.className =
            "large-file";


        const filePath =
            document.createElement("span");

        filePath.textContent =
            file.path;


        const fileSize =
            document.createElement("span");

        fileSize.textContent =
            formatSize(file.size);


        fileElement.appendChild(
            filePath
        );

        fileElement.appendChild(
            fileSize
        );


        largeFileList.appendChild(
            fileElement
        );

    });

}
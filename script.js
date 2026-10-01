const folderInput = document.getElementById("folderPath");
const scanButton = document.getElementById("scanButton");
const scanStatus = document.getElementById("scanStatus");


scanButton.addEventListener("click", async function () {

    const folderPath = folderInput.value.trim();


    if (folderPath === "") {

        alert("Please enter a folder path.");

        return;
    }


    scanButton.textContent = "Scanning...";

    scanStatus.textContent = "Connecting to Python...";


    try {

        const response = await fetch("http://127.0.0.1:5000/scan", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                folder_path: folderPath
            })

        });


        const data = await response.json();


        if (!response.ok) {

            throw new Error(data.error);

        }


        console.log("Scan results:", data);

        scanStatus.textContent = "Scan completed successfully.";

        scanButton.textContent = "Scan →";


        document.getElementById("fileCount").textContent =
            data.file_count;


        document.getElementById("totalStorage").textContent =
            data.total_size_formatted;


        document.getElementById("fileTypes").textContent =
            data.file_types;


        document.getElementById("emptyCount").textContent =
            data.empty_files;


    }

    catch (error) {

        console.error("Scan failed:", error);

        scanStatus.textContent =
            "Scan failed: " + error.message;

        scanButton.textContent = "Scan →";

    }

});
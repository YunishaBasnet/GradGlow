import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud, Trash2 } from "lucide-react";

export default function UploadPrediction() {
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const totalSizeLabel = useMemo(() => {
    if (!files.length) return "";
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    return `${(totalBytes / 1024).toFixed(1)} KB`;
  }, [files]);

  function isCsvFile(selectedFile) {
    if (!selectedFile) return false;
    const name = String(selectedFile.name || "").toLowerCase();
    const type = String(selectedFile.type || "").toLowerCase();
    return name.endsWith(".csv") || type.includes("csv");
  }

  function handleFiles(selectedFiles) {
    setMessage("");

    const incomingFiles = Array.from(selectedFiles || []);

    if (!incomingFiles.length) return;

    const invalidFile = incomingFiles.find((selectedFile) => !isCsvFile(selectedFile));

    if (invalidFile) {
      setFiles([]);
      setMessage("Please upload CSV files only.");
      return;
    }

    setFiles(incomingFiles);
  }

  function handleInputChange(event) {
    handleFiles(event.target.files);
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  }

  function handleRemoveFile(fileName) {
    setFiles((currentFiles) => currentFiles.filter((file) => file.name !== fileName));
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleRemoveAllFiles() {
    setFiles([]);
    setMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!files.length) {
      setMessage("Please choose the required CSV files before submitting.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/uploads/multiple", {
        method: "POST",
        body: formData,
      });

      let payload = {};

      try {
        payload = await response.json();
      } catch {
        payload = {};
      }

      if (!response.ok) {
        throw new Error(payload?.detail || "Upload failed. Please try again.");
      }

      setMessage("CSV files uploaded successfully. ETL completed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="studentsAdminPage">
      <div className="studentsAdminHeader">
        <div>
          <h2>Upload CSV for Prediction</h2>
          <p>Upload OULAD-style CSV files so ETL and ML can generate predictions.</p>
        </div>
      </div>

      <section className="uploadSingleCard">
        <div
          className={dragActive ? "uploadDropzone uploadDropzone--active" : "uploadDropzone"}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="uploadDropzoneIcon">
            <UploadCloud size={28} />
          </div>

          <h2>Drop your CSV files here</h2>
          <p>or click below to browse your files</p>

          <label className="uploadPrimaryBtn uploadBrowseBtn">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={handleInputChange}
              hidden
            />
            Choose CSV Files
          </label>

          <div className="uploadHint">
            Required files: studentInfo.csv, studentVle.csv, assessments.csv, studentAssessment.csv
          </div>
        </div>

        <div className="uploadSelectedBlock">
          <div className="uploadSelectedTitle">Selected Files</div>

          {files.length > 0 ? (
            <>
              {files.map((file) => (
                <div key={file.name} className="uploadFileRow">
                  <div className="uploadFileInfo">
                    <div className="uploadFileIcon">
                      <FileSpreadsheet size={20} />
                    </div>

                    <div className="uploadFileText">
                      <div className="uploadFileName">{file.name}</div>
                      <div className="uploadFileMeta">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="uploadRemoveBtn"
                    onClick={() => handleRemoveFile(file.name)}
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="uploadEmptyRow">Total selected: {files.length} file(s), {totalSizeLabel}</div>
            </>
          ) : (
            <div className="uploadEmptyRow">No files selected yet.</div>
          )}

          {message && (
            <p className="uploadMessage" role="alert">
              {message}
            </p>
          )}

          <div className="uploadFooterActions">
            {files.length > 0 ? (
              <button type="button" className="uploadRemoveBtn" onClick={handleRemoveAllFiles}>
                Clear
              </button>
            ) : null}

            <button type="button" className="uploadPrimaryBtn" onClick={handleSubmit} disabled={loading}>
              <UploadCloud size={16} />
              <span>{loading ? "Uploading..." : "Submit"}</span>
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
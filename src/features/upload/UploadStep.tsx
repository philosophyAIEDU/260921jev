import { useRef, useState } from "react";
import { downloadSampleCsv } from "../../lib/sampleInquiries";
import { AlertTriangleIcon } from "../../components/icons";

interface UploadStepProps {
  onFileSelected: (file: File) => void;
  errorMessage?: string;
}

export function UploadStep({ onFileSelected, errorMessage }: UploadStepProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    onFileSelected(files[0]);
  }

  return (
    <div className="card">
      <h2 className="card-title">고객 문의 파일 업로드</h2>
      <p className="card-subtitle">CSV, Excel(xlsx/xls) 또는 텍스트 PDF 파일을 업로드하세요.</p>

      <div
        className={`dropzone ${isDragOver ? "is-dragover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p style={{ fontWeight: 700, marginBottom: 8 }}>여기로 파일을 끌어다 놓으세요</p>
        <p className="text-muted" style={{ marginBottom: 16, fontSize: 13 }}>
          또는
        </p>
        <button type="button" className="btn btn-primary" onClick={() => inputRef.current?.click()}>
          파일 선택
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          className="visually-hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {errorMessage && (
        <div className="notice-banner danger" style={{ marginTop: 14 }}>
          <AlertTriangleIcon />
          <div>{errorMessage}</div>
        </div>
      )}

      <div className="notice-banner info" style={{ marginTop: 14 }}>
        <AlertTriangleIcon />
        <div>
          지원 형식: .csv, .xlsx, .xls, .pdf (텍스트 PDF만 지원, 최대 5MB, 최대 200건). 이 앱은
          데모/교육용이므로 실제 고객의 개인정보가 포함된 자료는 업로드하지 마세요.
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-secondary" onClick={downloadSampleCsv}>
          샘플 데이터 다운로드 (CSV)
        </button>
      </div>
    </div>
  );
}

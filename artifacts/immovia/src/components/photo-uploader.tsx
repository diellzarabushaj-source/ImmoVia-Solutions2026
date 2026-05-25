import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedPhoto {
  objectPath: string;
  previewUrl: string;
}

interface PhotoUploaderProps {
  label?: string;
  hint?: string;
  multiple?: boolean;
  value: string[];
  onChange: (paths: string[]) => void;
}

export function PhotoUploader({ label, hint, multiple = false, value, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<UploadedPhoto[]>(
    value.map(p => ({ objectPath: p, previewUrl: `/api/storage${p}` }))
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<UploadedPhoto> => {
    const res = await fetch("/api/storage/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
    });
    if (!res.ok) throw new Error("Failed to get upload URL");
    const { uploadURL, objectPath } = await res.json() as { uploadURL: string; objectPath: string };
    const putRes = await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!putRes.ok) throw new Error("Upload to storage failed");
    return { objectPath, previewUrl: URL.createObjectURL(file) };
  };

  const handleFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);
    try {
      const toUpload = multiple ? Array.from(files) : [files[0]];
      const results: UploadedPhoto[] = [];
      for (const file of toUpload) {
        if (!file.type.startsWith("image/")) { setError("Only image files are allowed."); continue; }
        if (file.size > 10 * 1024 * 1024) { setError("Max file size is 10MB."); continue; }
        results.push(await uploadFile(file));
      }
      const newPreviews = multiple ? [...previews, ...results] : results;
      setPreviews(newPreviews);
      onChange(newPreviews.map(p => p.objectPath));
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (idx: number) => {
    const next = previews.filter((_, i) => i !== idx);
    setPreviews(next);
    onChange(next.map(p => p.objectPath));
  };

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className={`grid gap-2 ${multiple ? "grid-cols-3" : "grid-cols-1"}`}>
          {previews.map((photo, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-border bg-muted aspect-square">
              <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {(multiple || previews.length === 0) && (
        <div
          className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all"
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files); }}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {uploading ? "Uploading..." : "Click to upload or drag & drop"}
            </p>
            {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
          </div>
          {!uploading && (
            <Button type="button" variant="outline" size="sm" className="pointer-events-none">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Choose {multiple ? "files" : "photo"}
            </Button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={e => { if (e.target.files?.length) void handleFiles(e.target.files); e.target.value = ""; }}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

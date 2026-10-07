"use client";

import { useRef, useState, useEffect, ChangeEvent } from "react";
import {
  Camera as CameraIcon,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

type Props = {
  onFile: (file: File | null) => void;
  currentFile: File | null;
};

export function CameraLabUploader({ onFile, currentFile }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<"idle" | "camera">("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (currentFile) {
      const url = URL.createObjectURL(currentFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [currentFile]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function startCamera() {
    setCameraError(null);
    setMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setCameraError(
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow access in your browser settings."
          : err?.name === "NotFoundError"
          ? "No camera found on this device. Use file upload instead."
          : "Could not access camera: " + (err?.message || "unknown error")
      );
      setMode("idle");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setMode("idle");
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    setCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCapturing(false);
          return;
        }
        const file = new File(
          [blob],
          `lab-capture-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );
        onFile(file);
        stopCamera();
        setCapturing(false);
      },
      "image/jpeg",
      0.9
    );
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  }

  function clearFile() {
    onFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      {mode === "idle" && !previewUrl && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:border-sky-400 transition"
        >
          <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-6 h-6 text-sky-600" />
          </div>
          <p className="text-sm text-slate-700 font-medium mb-1">
            Capture or upload lab sheet
          </p>
          <p className="text-xs text-slate-500 mb-4">
            Take a photo of printed labs or drag & drop an image
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-teal-600 text-white text-sm font-medium hover:opacity-90 shadow-md shadow-sky-200"
            >
              <CameraIcon className="w-4 h-4" /> Open Camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              <Upload className="w-4 h-4" /> Choose File
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />
          {cameraError && (
            <p className="mt-3 text-xs text-rose-600">{cameraError}</p>
          )}
        </div>
      )}

      {mode === "camera" && (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-64 sm:h-80 object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-4 border-2 border-white/40 rounded-lg pulse-ring" />
          </div>
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-2 rounded-lg bg-white/20 text-white text-sm backdrop-blur hover:bg-white/30"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              disabled={capturing}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition disabled:opacity-60"
            >
              {capturing ? (
                <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-teal-500" />
              )}
            </button>
            <div className="w-16" />
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="relative rounded-xl overflow-hidden border border-slate-200">
          <img
            src={previewUrl}
            alt="Lab sheet preview"
            className="w-full h-48 sm:h-64 object-contain bg-slate-50"
          />
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white text-rose-600 shadow"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="p-2 bg-slate-50 text-xs text-slate-600 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            {currentFile?.name} ·{" "}
            {currentFile &&
              `${(currentFile.size / 1024).toFixed(0)} KB`}
          </div>
        </div>
      )}
    </div>
  );
}

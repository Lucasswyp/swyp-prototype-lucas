export const USE_MUX = process.env.NEXT_PUBLIC_USE_MUX === "1";

export interface UploadedVideo {
  videoUrl: string;
  posterUrl: string;
}

export interface UploadProgress {
  stage: "uploading" | "processing";
  percent: number;
}

function putWithProgress(url: string, file: File, onPercent: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onPercent(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload mislukt.")));
    xhr.onerror = () => reject(new Error("Geen verbinding tijdens het uploaden."));
    xhr.send(file);
  });
}

// Uploads straight to Mux, then waits (polling our own status route) until the
// video has been transcoded and can be streamed.
export async function uploadVideoToMux(
  file: File,
  onProgress: (p: UploadProgress) => void
): Promise<UploadedVideo> {
  const res = await fetch("/api/video/upload", { method: "POST" });
  const created = await res.json().catch(() => ({}));
  if (!res.ok || !created.url) throw new Error(created.error ?? "Upload voorbereiden is mislukt.");

  onProgress({ stage: "uploading", percent: 0 });
  await putWithProgress(created.url, file, (percent) => onProgress({ stage: "uploading", percent }));

  onProgress({ stage: "processing", percent: 100 });
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 2500));
    const statusRes = await fetch(`/api/video/status?uploadId=${encodeURIComponent(created.uploadId)}`);
    const status = await statusRes.json().catch(() => ({}));
    if (status.status === "ready") return { videoUrl: status.videoUrl, posterUrl: status.posterUrl };
    if (status.status === "errored") throw new Error("De video kon niet worden verwerkt. Probeer een ander bestand.");
  }
  throw new Error("Het verwerken duurt te lang. Probeer het later opnieuw.");
}

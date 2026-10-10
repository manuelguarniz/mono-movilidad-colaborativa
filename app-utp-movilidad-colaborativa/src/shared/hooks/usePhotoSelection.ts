import { useEffect, useState } from "react";
import { validatePhoto } from "@/shared/api/fileService";

/**
 * Foto elegida en un formulario y su vista previa. La imagen se sube al guardar, con
 * `uploadPhoto`; `error` avisa si no cumple el formato o el tamaño del contrato.
 */
export function usePhotoSelection() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return {
    file,
    previewUrl,
    error,
    select: (selected: File) => {
      const validationError = validatePhoto(selected);
      setError(validationError);
      if (!validationError) {
        setFile(selected);
      }
    },
    clear: () => {
      setFile(null);
      setError("");
    },
  };
}

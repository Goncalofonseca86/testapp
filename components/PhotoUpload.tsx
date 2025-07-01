import React, { useState, useCallback } from "react";
import { Upload, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PhotoUploadProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 10,
}: PhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).filter(
      (file) => file.type.startsWith("image/") && photos.length < maxPhotos,
    );

    const availableSlots = maxPhotos - photos.length;
    const filesToAdd = newFiles.slice(0, availableSlots);

    onPhotosChange([...photos, ...filesToAdd]);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors",
          dragActive && "border-leirisonda-blue bg-leirisonda-blue-light",
          photos.length >= maxPhotos && "opacity-50 pointer-events-none",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          id="photo-upload"
          disabled={photos.length >= maxPhotos}
        />

        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Carregar Fotografias
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Arraste e solte ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground">
              {photos.length}/{maxPhotos} fotografias
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("photo-upload")?.click()}
            disabled={photos.length >= maxPhotos}
          >
            <Camera className="w-4 h-4 mr-2" />
            Escolher Fotografias
          </Button>
        </div>
      </div>

      {/* Photo Preview Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Fotografia ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>

              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/50 text-white text-xs px-2 py-1 rounded truncate">
                  {photo.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useCallback } from "react";
import { Upload, X, Camera, Plus, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PhotoData {
  id: string;
  file?: File;
  url: string;
  filename: string;
  description: string;
  category: "general" | "equipment" | "issues" | "before" | "after";
  uploadedAt: string;
}

interface PoolPhotoUploadProps {
  photos: PhotoData[];
  onPhotosChange: (photos: PhotoData[]) => void;
  maxPhotos?: number;
  type: "pool" | "intervention";
}

const categoryLabels = {
  general: "Geral",
  equipment: "Equipamentos",
  issues: "Problemas",
  before: "Antes",
  after: "Depois",
};

const categoryColors = {
  general: "bg-blue-100 text-blue-800",
  equipment: "bg-green-100 text-green-800",
  issues: "bg-red-100 text-red-800",
  before: "bg-yellow-100 text-yellow-800",
  after: "bg-purple-100 text-purple-800",
};

export function PoolPhotoUpload({
  photos,
  onPhotosChange,
  maxPhotos = 20,
  type,
}: PoolPhotoUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [photos, maxPhotos],
  );

  const handleFiles = (fileList: FileList) => {
    const newFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );

    const availableSlots = maxPhotos - photos.length;
    const filesToAdd = newFiles.slice(0, availableSlots);

    const newPhotos = filesToAdd.map((file) => {
      const url = URL.createObjectURL(file);
      return {
        id: crypto.randomUUID(),
        file,
        url,
        filename: file.name,
        description: "",
        category: "general" as const,
        uploadedAt: new Date().toISOString(),
      };
    });

    onPhotosChange([...photos, ...newPhotos]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removePhoto = (photoId: string) => {
    const photoToRemove = photos.find((p) => p.id === photoId);
    if (photoToRemove?.url && photoToRemove.file) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    onPhotosChange(photos.filter((photo) => photo.id !== photoId));
  };

  const updatePhoto = (photoId: string, updates: Partial<PhotoData>) => {
    onPhotosChange(
      photos.map((photo) =>
        photo.id === photoId ? { ...photo, ...updates } : photo,
      ),
    );
  };

  const editPhoto = (photo: PhotoData) => {
    setSelectedPhoto(photo);
    setIsDialogOpen(true);
  };

  const savePhotoEdits = () => {
    if (selectedPhoto) {
      updatePhoto(selectedPhoto.id, {
        description: selectedPhoto.description,
        category: selectedPhoto.category,
      });
      setIsDialogOpen(false);
      setSelectedPhoto(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          photos.length >= maxPhotos && "opacity-50 pointer-events-none",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          {type === "pool"
            ? "Adicionar Fotos da Piscina"
            : "Adicionar Fotos da Intervenção"}
        </p>
        <p className="text-gray-600 mb-4">
          Arrasta fotos aqui ou clica para selecionar
        </p>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="photo-upload"
          disabled={photos.length >= maxPhotos}
        />

        <Button asChild variant="outline">
          <label htmlFor="photo-upload" className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Selecionar Fotos
          </label>
        </Button>

        <p className="text-sm text-gray-500 mt-3">
          {photos.length} de {maxPhotos} fotos • PNG, JPG até 10MB
        </p>
      </div>

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">
            Fotos Adicionadas ({photos.length})
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
              >
                <img
                  src={photo.url}
                  alt={photo.description || photo.filename}
                  className="w-full h-full object-cover"
                />

                {/* Category Badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      categoryColors[photo.category],
                    )}
                  >
                    {categoryLabels[photo.category]}
                  </span>
                </div>

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => editPhoto(photo)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removePhoto(photo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Description Preview */}
                {photo.description && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                    <p className="text-xs truncate">{photo.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Photo Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Foto</DialogTitle>
          </DialogHeader>

          {selectedPhoto && (
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.filename}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={selectedPhoto.category}
                  onValueChange={(value) =>
                    setSelectedPhoto({
                      ...selectedPhoto,
                      category: value as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={selectedPhoto.description}
                  onChange={(e) =>
                    setSelectedPhoto({
                      ...selectedPhoto,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descrição da foto..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={savePhotoEdits}>Guardar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

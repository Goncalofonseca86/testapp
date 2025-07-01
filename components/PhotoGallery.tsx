import React, { useState } from "react";
import {
  Eye,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  filename: string;
  description: string;
  category?: string;
  uploadedAt: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  title: string;
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

export function PhotoGallery({ photos, title, type }: PhotoGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (photos.length === 0) {
    return null;
  }

  const openPhoto = (index: number) => {
    setSelectedPhotoIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPhotoIndex(null);
  };

  const navigatePhoto = (direction: "prev" | "next") => {
    if (selectedPhotoIndex === null) return;

    if (direction === "prev") {
      setSelectedPhotoIndex(
        selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : photos.length - 1,
      );
    } else {
      setSelectedPhotoIndex(
        selectedPhotoIndex < photos.length - 1 ? selectedPhotoIndex + 1 : 0,
      );
    }
  };

  const downloadPhoto = (photo: Photo) => {
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = photo.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentPhoto =
    selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  // Group photos by category if they have categories
  const groupedPhotos = photos.reduce(
    (acc, photo) => {
      const category = photo.category || "general";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(photo);
      return acc;
    },
    {} as Record<string, Photo[]>,
  );

  const hasCategories =
    Object.keys(groupedPhotos).length > 1 ||
    photos.some((p) => p.category && p.category !== "general");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {title} ({photos.length})
        </h3>
      </div>

      {hasCategories ? (
        // Grouped by category
        <div className="space-y-6">
          {Object.entries(groupedPhotos).map(([category, categoryPhotos]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-full",
                    categoryColors[category as keyof typeof categoryColors] ||
                      "bg-gray-100 text-gray-800",
                  )}
                >
                  {categoryLabels[category as keyof typeof categoryLabels] ||
                    category}
                </span>
                <span className="text-sm text-gray-500">
                  {categoryPhotos.length} foto
                  {categoryPhotos.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryPhotos.map((photo) => {
                  const photoIndex = photos.findIndex((p) => p.id === photo.id);
                  return (
                    <div
                      key={photo.id}
                      className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openPhoto(photoIndex)}
                    >
                      <img
                        src={photo.url}
                        alt={photo.description || photo.filename}
                        className="w-full h-full object-cover"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="sm" variant="secondary">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Description Preview */}
                      {photo.description && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                          <p className="text-xs truncate">
                            {photo.description}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Simple grid
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openPhoto(index)}
            >
              <img
                src={photo.url}
                alt={photo.description || photo.filename}
                className="w-full h-full object-cover"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="sm" variant="secondary">
                  <Eye className="h-4 w-4" />
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
      )}

      {/* Photo Viewer Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{currentPhoto?.description || currentPhoto?.filename}</span>
              <div className="flex items-center gap-2">
                {photos.length > 1 && (
                  <span className="text-sm text-gray-500">
                    {(selectedPhotoIndex || 0) + 1} de {photos.length}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentPhoto && downloadPhoto(currentPhoto)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {currentPhoto && (
            <div className="space-y-4">
              {/* Image Container */}
              <div className="relative">
                <div className="max-h-96 overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                  <img
                    src={currentPhoto.url}
                    alt={currentPhoto.description || currentPhoto.filename}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Navigation Arrows */}
                {photos.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => navigatePhoto("prev")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() => navigatePhoto("next")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Photo Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>
                      {format(
                        new Date(currentPhoto.uploadedAt),
                        "dd/MM/yyyy HH:mm",
                        {
                          locale: pt,
                        },
                      )}
                    </span>
                  </div>

                  {currentPhoto.category && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <span
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full",
                          categoryColors[
                            currentPhoto.category as keyof typeof categoryColors
                          ] || "bg-gray-100 text-gray-800",
                        )}
                      >
                        {categoryLabels[
                          currentPhoto.category as keyof typeof categoryLabels
                        ] || currentPhoto.category}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-gray-600">
                    <strong>Ficheiro:</strong> {currentPhoto.filename}
                  </p>
                  {currentPhoto.description && (
                    <p className="text-gray-600 mt-2">
                      <strong>Descrição:</strong> {currentPhoto.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

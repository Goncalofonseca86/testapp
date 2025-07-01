import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Camera, MapPin, Calendar } from "lucide-react";
import { Work, WorkStatus } from "@shared/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WorkCardProps {
  work: Work;
}

const statusConfig: Record<
  WorkStatus,
  { label: string; color: string; bgColor: string }
> = {
  open: {
    label: "Aberta",
    color: "text-red-700",
    bgColor: "bg-red-100 hover:bg-red-200",
  },
  "in-progress": {
    label: "Em Curso",
    color: "text-orange-700",
    bgColor: "bg-orange-100 hover:bg-orange-200",
  },
  completed: {
    label: "Concluída",
    color: "text-green-700",
    bgColor: "bg-green-100 hover:bg-green-200",
  },
};

export function WorkCard({ work }: WorkCardProps) {
  const status = statusConfig[work.status];

  return (
    <Link
      to={`/works/${work.id}`}
      className="block bg-white border border-border rounded-xl p-6 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-lg mb-1">
            {work.client}
          </h3>
          <div className="flex items-center text-muted-foreground text-sm mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {work.address}
          </div>
        </div>
        <Badge className={cn(status.bgColor, status.color, "border-0")}>
          {status.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-1" />
          {format(new Date(work.entryDate), "dd/MM/yyyy HH:mm", {
            locale: pt,
          })}
        </div>

        {work.photos.length > 0 && (
          <div className="flex items-center">
            <Camera className="w-4 h-4 mr-1" />
            <span>{work.photos.length}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

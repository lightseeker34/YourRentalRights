import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Pencil, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

interface EditableTextProps {
  contentKey: string;
  defaultValue: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
}

export function EditableText({ contentKey, defaultValue, as: Tag = "p", className = "" }: EditableTextProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: content } = useQuery({
    queryKey: ["/api/content", contentKey],
    queryFn: async () => {
      const res = await fetch(`/api/content/${contentKey}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.value;
    },
  });

  const displayValue = content ?? defaultValue;

  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      await apiRequest("PUT", `/api/content/${contentKey}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content", contentKey] });
      setIsEditing(false);
    },
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    setEditValue(displayValue);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (editValue.trim() && editValue !== displayValue) {
      saveMutation.mutate(editValue);
    } else {
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="relative w-full">
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full bg-white/80 border-2 border-blue-500 rounded px-3 py-4 focus:outline-none resize-none text-center leading-normal ${className}`}
          rows={Math.max(2, editValue.split("\n").length)}
          style={{ minHeight: "3em", lineHeight: "1.3" }}
          data-testid={`edit-input-${contentKey}`}
        />
        <div className="flex justify-center gap-2 mt-2">
          <button
            onClick={saveEdit}
            disabled={saveMutation.isPending}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors shadow-md flex items-center gap-1"
            data-testid={`save-${contentKey}`}
          >
            <Check className="w-4 h-4" /> Save
          </button>
          <button
            onClick={cancelEdit}
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors shadow-md flex items-center gap-1"
            data-testid={`cancel-${contentKey}`}
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative inline-block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tag className={`${className}`} data-testid={`content-${contentKey}`}>
        {displayValue}
      </Tag>
      {isAdmin && isHovered && (
        <button
          onClick={startEditing}
          className="absolute -top-2 -right-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg z-50 cursor-pointer"
          style={{ transform: 'translate(50%, -50%)' }}
          data-testid={`edit-btn-${contentKey}`}
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

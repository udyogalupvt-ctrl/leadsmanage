import { useRef, useState } from "react";
import { Download, FileText, Trash2, Upload, Loader2, Music, Video as VideoIcon, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Attachment } from "@/lib/types";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { addAttachment, removeAttachment } from "@/lib/leads";
import { format } from "date-fns";

function iconFor(a: Attachment) {
  if (a.resourceType === "image") return ImageIcon;
  if (a.resourceType === "video" && a.format && ["mp3", "wav", "m4a", "aac", "ogg"].includes(a.format))
    return Music;
  if (a.resourceType === "video") return VideoIcon;
  return FileText;
}

function isImage(a: Attachment) {
  return a.resourceType === "image";
}
function isVideo(a: Attachment) {
  return a.resourceType === "video" && !!a.format && !["mp3", "wav", "m4a", "aac", "ogg"].includes(a.format);
}
function isAudio(a: Attachment) {
  return a.resourceType === "video" && !!a.format && ["mp3", "wav", "m4a", "aac", "ogg"].includes(a.format);
}

export function Attachments({ leadId, attachments }: { leadId: string; attachments: Attachment[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadToCloudinary(file);
        await addAttachment(leadId, { ...uploaded, uploadedAt: Date.now() });
      }
      toast.success(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDelete = async (a: Attachment) => {
    try {
      await removeAttachment(leadId, a.publicId);
      toast.success("Attachment removed");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to remove");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Attachments</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
          Upload
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {attachments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No attachments yet. Upload images, PDFs, audio or video.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {attachments.map((a) => {
            const Icon = iconFor(a);
            return (
              <div key={a.publicId} className="card-surface overflow-hidden">
                <div className="relative aspect-video w-full bg-muted">
                  {isImage(a) ? (
                    <img src={a.url} alt={a.originalName} className="h-full w-full object-cover" />
                  ) : isVideo(a) ? (
                    <video src={a.url} controls className="h-full w-full object-cover" />
                  ) : isAudio(a) ? (
                    <div className="flex h-full items-center justify-center p-3">
                      <audio src={a.url} controls className="w-full" />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
                      <Icon className="h-8 w-8" />
                      <span className="text-xs">{a.format?.toUpperCase() ?? "FILE"}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">
                      {a.originalName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(a.uploadedAt, "MMM d, yyyy")} · {(a.bytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this attachment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove it from the lead. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(a)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

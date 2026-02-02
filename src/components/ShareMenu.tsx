import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonProps {
  title?: string;
  text?: string;
  mediaType: string; 
  id: string; 
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title = "CinemaHub",
  text = "Check out this movie on CinemaHub!",
  mediaType,
  id,
}) => {
  const currentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${mediaType}/${id}`
      : "";

  const handleShare = async () => {
    const shareData = {
      title,
      text,
      url: currentUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(currentUrl);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to copy link.");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="p-2 sm:p-3 bg-muted text-foreground border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all duration-100"
    >
      <Share2 className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
    </button>
  );
};

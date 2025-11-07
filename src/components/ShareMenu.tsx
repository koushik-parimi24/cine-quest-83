

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <Button
      variant="link"
      onClick={handleShare}
      className="bg-white text-black hover:bg-blue-500 hover:text-white transition-all hover:scale-105 rounded-full"
    >
      <Share2 className=" h-4 w-4 sm:h-5 sm:w-5" />
    
    </Button>
  );
};

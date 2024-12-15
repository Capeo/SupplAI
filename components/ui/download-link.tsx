import { Download } from "lucide-react";

interface DownloadLinkProps {
  filename: string;
  label: string;
}

export function DownloadLink({ filename, label }: DownloadLinkProps) {
  return (
    <button 
      onClick={() => window.open(`/${filename}`, '_blank')}
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      <Download className="w-3 h-3" />
      {label}
    </button>
  );
} 
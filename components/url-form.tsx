"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  X, 
  Loader2,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import debounce from "lodash.debounce";
import { motion } from "framer-motion";

interface UrlFormProps {
  onUrlCreated: () => void;
}

export function UrlForm({ onUrlCreated }: UrlFormProps) {
  const { data: session } = useSession();
  const [url, setUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [codeStatus, setCodeStatus] = useState<"idle" | "checking" | "available" | "unavailable">("idle");
  const [codeError, setCodeError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkCodeAvailability = useCallback(
    debounce(async (code: string) => {
      if (!code || code.length < 3) {
        setCodeStatus("idle");
        setCodeError(null);
        return;
      }

      setCodeStatus("checking");
      const toastId = toast.loading("Đang kiểm tra mã rút gọn...");
      
      try {
        const res = await fetch(`/api/urls/check-code?code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (data.available) {
          setCodeStatus("available");
          setCodeError(null);
          toast.success("Mã rút gọn khả dụng!", { id: toastId });
        } else {
          setCodeStatus("unavailable");
          setCodeError(data.error || "Mã này đã được sử dụng");
          toast.error(data.error || "Mã này đã được sử dụng", { id: toastId });
        }
      } catch {
        setCodeStatus("idle");
        setCodeError("Không thể kiểm tra");
        toast.error("Không thể kiểm tra mã rút gọn", { id: toastId });
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (customCode) {
      checkCodeAvailability(customCode);
    } else {
      setCodeStatus("idle");
      setCodeError(null);
    }
  }, [customCode, checkCodeAvailability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear error status when submitting
    setCodeError(null);
    setCodeStatus("idle");
    
    if (!session) {
      toast.error("Vui lòng đăng nhập để tạo liên kết");
      return;
    }

    if (!url.trim()) {
      toast.error("Vui lòng nhập URL");
      return;
    }

    if (customCode && codeStatus === "unavailable") {
      toast.error("Mã rút gọn không khả dụng");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalUrl: url.trim(),
          customCode: customCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Có lỗi xảy ra");
      }

      toast.success("Tạo liên kết thành công!");
      setUrl("");
      setCustomCode("");
      setCodeStatus("idle");
      onUrlCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const getCodeStatusIcon = () => {
    switch (codeStatus) {
      case "checking":
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      case "available":
        return <Check className="w-4 h-4 text-green-500" />;
      case "unavailable":
        return <X className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: URL Input with Button */}
        <div className="flex items-center gap-2 p-2 bg-background  border border-border rounded-full shadow-sm">
         
          <Input
            type="text"
            placeholder="Dán URL dài của bạn vào đây..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 h-12 rounded-full border-0 bg-transparent border border-border  text-base placeholder:text-muted-foreground/60 !bg-white"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !url.trim() || (customCode.length > 0 && codeStatus !== "available" && codeStatus !== "idle")}
            className="h-12 px-6 rounded-full bg-primary hover:bg-primary/80 text-white transition-all font-medium gap-2"
          >
            Rút gọn
          </Button>
        </div>

        {/* Row 2: Custom Code Input */}
        <div className=" py-1 flex items-center gap-3 px-4">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Mã rút gọn (tuỳ chọn):
          </span>
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Tối đa 20 ký tự"
              value={customCode}
              onChange={(e) => {
                const newValue = e.target.value.replace(/[^a-zA-Z0-9-_]/g, "");
                setCustomCode(newValue);
                // Clear error status when user starts typing
                if (codeError) {
                  setCodeError(null);
                  setCodeStatus("idle");
                }
              }}
              className="h-12 w-full rounded-xl border-border bg-background pr-10 text-sm"
              disabled={isLoading}
              maxLength={20}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getCodeStatusIcon()}
            </div>
          </div>
          {codeError && codeStatus === "unavailable" && (
            <span className="text-sm text-destructive">{codeError}</span>
          )}
        </div>
      </form>
    </motion.div>
  );
}

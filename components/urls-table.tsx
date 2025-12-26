"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Copy, 
  ExternalLink, 
  QrCode, 
  Trash2, 
  Eye,
  BarChart3,
  Edit2,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeDisplay } from "./qr-code-display";
import { LinkAnalyticsDialog } from "./link-analytics-dialog";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Url {
  id: string;
  shortCode: string;
  originalUrl: string;
  visitCount: number;
  createdAt: string;
  _count?: { visits: number };
}

interface UrlsTableProps {
  refreshTrigger: number;
  delayLoad?: boolean;
}

export function UrlsTable({ refreshTrigger, delayLoad = false }: UrlsTableProps) {
  const [urls, setUrls] = useState<Url[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<{ id: string; shortCode: string } | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const fetchUrls = async () => {
    try {
      const res = await fetch("/api/urls");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUrls(data.urls || []);
    } catch {
      toast.error("Không thể tải danh sách liên kết");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't fetch while animation is still running
    if (!delayLoad) {
      fetchUrls();
    }
  }, [refreshTrigger, delayLoad]);

  const copyToClipboard = async (shortCode: string) => {
    const fullUrl = `${baseUrl}/${shortCode}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Đã sao chép liên kết!");
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/urls/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Đã xóa liên kết");
      setUrls((prev) => prev.filter((u) => u.id !== id));
    } catch {
      toast.error("Không thể xóa liên kết");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/urls/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: editValue }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      
      toast.success("Đã cập nhật liên kết");
      setUrls((prev) =>
        prev.map((u) => (u.id === id ? { ...u, originalUrl: editValue } : u))
      );
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật");
    }
  };

  const openAnalytics = (url: Url) => {
    setSelectedUrl({ id: url.id, shortCode: url.shortCode });
    setAnalyticsOpen(true);
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    return url.length > maxLength ? url.substring(0, maxLength) + "..." : url;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-muted flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Chưa có liên kết nào</h3>
        <p className="text-muted-foreground">
          Tạo liên kết rút gọn đầu tiên của bạn ở trên!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl border bg-background overflow-x-auto">
        <Table className="border-collapse [&_th]:border-b [&_th]:border-r [&_th:last-child]:border-r-0 [&_td]:border-b [&_td]:border-r [&_td:last-child]:border-r-0 [&_tr:last-child_td]:border-b-0">
          <TableHeader>
            <TableRow className="bg-card hover:bg-transparent">
              <TableHead className="text-center w-[220px]">Liên kết rút gọn</TableHead>
              <TableHead>URL gốc</TableHead>
              <TableHead className="text-center w-[120px]">Lượt truy cập</TableHead>
              <TableHead className="text-center w-[140px]">Ngày tạo</TableHead>
              <TableHead className="text-center w-[180px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {urls.map((url) => (
              <TableRow key={url.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono text-sm px-3 py-1 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors"
                      onClick={() => copyToClipboard(url.shortCode)}
                    >
                      /{url.shortCode}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {editingId === url.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 rounded-xl text-sm"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-500 hover:text-green-600"
                        onClick={() => handleEdit(url.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={url.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 max-w-[300px]"
                        >
                          <span className="truncate">{truncateUrl(url.originalUrl)}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-md">
                        <p className="break-all">{url.originalUrl}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 rounded-xl hover:bg-primary/10 gap-1.5"
                          onClick={() => openAnalytics(url)}
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold">{url.visitCount.toLocaleString()}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Xem thống kê chi tiết</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(url.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  }).replace(/^./, (c) => c.toUpperCase())}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    {/* Copy */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-xl"
                          onClick={() => copyToClipboard(url.shortCode)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Sao chép</TooltipContent>
                    </Tooltip>

                    {/* QR Code Dialog */}
                    <Dialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-xl"
                            >
                              <QrCode className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>QR Code</TooltipContent>
                      </Tooltip>
                      <DialogContent className="flex overflow-auto h-[90vh] md:h-[calc(100vh-8rem)]  min-w-[calc(50vw)] flex-col gap-0 p-0 rounded-3xl overflow-hidden">
                        <DialogHeader className="px-5 py-4 border-b shrink-0">
                          <DialogTitle>Tùy chỉnh QR Code</DialogTitle>
                          <DialogDescription className="font-mono text-xs">
                            {baseUrl}/{url.shortCode}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-hidden">
                          <QRCodeDisplay
                            url={`${baseUrl}/${url.shortCode}`}
                            shortCode={url.shortCode}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-xl"
                          onClick={() => {
                            setEditingId(url.id);
                            setEditValue(url.originalUrl);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Chỉnh sửa</TooltipContent>
                    </Tooltip>

                    {/* Delete Dialog */}
                    <Dialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 rounded-xl text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Xóa</TooltipContent>
                      </Tooltip>
                      <DialogContent className="sm:max-w-md rounded-3xl">
                        <DialogHeader>
                          <DialogTitle>Xác nhận xóa</DialogTitle>
                          <DialogDescription>
                            Bạn có chắc chắn muốn xóa liên kết này? Hành động này không thể hoàn tác.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 space-x-2 sm:gap-0">
                          <DialogClose asChild>
                            <Button variant="outline" className="rounded-full">
                              Hủy
                            </Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              variant="destructive"
                              className="rounded-full"
                              onClick={() => handleDelete(url.id)}
                              disabled={deletingId === url.id}
                            >
                              {deletingId === url.id ? "Đang xóa..." : "Xóa"}
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Analytics Dialog */}
      {selectedUrl && (
        <LinkAnalyticsDialog
          open={analyticsOpen}
          onOpenChange={setAnalyticsOpen}
          urlId={selectedUrl.id}
          shortCode={selectedUrl.shortCode}
        />
      )}
    </>
  );
}

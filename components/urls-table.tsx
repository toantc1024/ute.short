"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
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
  X,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeDisplay } from "./qr-code-display";
import { LinkAnalyticsDialog } from "./link-analytics-dialog";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface UrlUser {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

interface Url {
  id: string;
  shortCode: string;
  originalUrl: string;
  visitCount: number;
  createdAt: string;
  _count?: { visits: number };
  user?: UrlUser | null;
}

interface UrlsTableProps {
  refreshTrigger: number;
  delayLoad?: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function UrlsTable({ refreshTrigger, delayLoad = false }: UrlsTableProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [urls, setUrls] = useState<Url[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<{ id: string; shortCode: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [limit, setLimit] = useState(10);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const fetchUrls = async (pageNum: number = page, pageLimit: number = limit) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/urls?page=${pageNum}&limit=${pageLimit}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUrls(data.urls || []);
      setPagination(data.pagination || null);
      if (!initialLoaded) setInitialLoaded(true);
    } catch {
      toast.error("Không thể tải danh sách liên kết");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Don't fetch while animation is still running
    if (!delayLoad) {
      // Reset to page 1 when refresh is triggered (new URL created)
      if (refreshTrigger > 0) {
        setPage(1);
        fetchUrls(1);
      } else {
        fetchUrls();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Show skeleton only on initial load, not on pagination/refresh
  if (isLoading && !initialLoaded) {
    return (
      <div className="rounded-3xl border bg-background p-8">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Đang tải danh sách liên kết...</span>
        </div>
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

  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value);
    setLimit(newLimit);
    setPage(1);
    fetchUrls(1, newLimit);
  };

  return (
    <>
      <div className="rounded-3xl border bg-background overflow-x-auto relative">
        <Table className="border-collapse [&_th]:border-b [&_th]:border-r [&_th:last-child]:border-r-0 [&_td]:border-b [&_td]:border-r [&_td:last-child]:border-r-0 [&_tr:last-child_td]:border-b-0">
          <TableHeader>
            <TableRow className="bg-card hover:bg-transparent">
              <TableHead className="text-center w-[220px]">Liên kết rút gọn</TableHead>
              <TableHead>URL gốc</TableHead>
              {isAdmin && <TableHead className="text-center w-[150px]">Người tạo</TableHead>}
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
                {isAdmin && (
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {url.user ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                              {url.user.image ? (
                                <Image
                                  src={url.user.image}
                                  alt={url.user.name || "User"}
                                  width={28}
                                  height={28}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                </div>
                              )}
                              <span className="text-sm truncate max-w-[80px]">
                                {url.user.name?.split(" ").slice(-1)[0] || "User"}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{url.user.name}</p>
                            <p className="text-xs text-muted-foreground">{url.user.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>
                  </TableCell>
                )}
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
                      <DialogContent className="flex overflow-auto h-[90vh] md:h-[calc(100vh-8rem)]  min-w-[calc(80vw)] flex-col gap-0 p-0 rounded-3xl overflow-hidden">
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
        
        {/* Loading Overlay */}
        {isLoading && initialLoaded && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang tải...</span>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} trong số {pagination.total} liên kết
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Số dòng:</span>
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[80px] h-8 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="10" className="rounded-lg">10</SelectItem>
                  <SelectItem value="20" className="rounded-lg">20</SelectItem>
                  <SelectItem value="50" className="rounded-lg">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => { setPage(1); fetchUrls(1); }}
                disabled={page === 1 || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => { setPage(p => p - 1); fetchUrls(page - 1); }}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-sm font-medium">{page}</span>
                <span className="text-sm text-muted-foreground">/</span>
                <span className="text-sm text-muted-foreground">{pagination.totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => { setPage(p => p + 1); fetchUrls(page + 1); }}
                disabled={page === pagination.totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                onClick={() => { setPage(pagination.totalPages); fetchUrls(pagination.totalPages); }}
                disabled={page === pagination.totalPages || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

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

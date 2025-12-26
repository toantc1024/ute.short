import Link from "next/link";
import { Link2Off, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { ErrorPageLayout } from "@/components/error-page-layout";

export default function NotFoundPage() {
  return (
    <ErrorPageLayout
      icon={<Link2Off className="w-12 h-12 text-primary" />}
      iconClassName="bg-primary/10"
      title="Liên kết không tồn tại"
      description="Liên kết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."
      actions={
        <Button asChild variant="outline" className="rounded-full px-6">
          <Link href="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Về trang chủ
          </Link>
        </Button>
      }
      footer={<Footer animate animationDelay={0.4} />}
    />
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
  animate?: boolean;
  animationDelay?: number;
}

export function Footer({ className, animate = false, animationDelay = 0 }: FooterProps) {
  const content = (
    <div className="container flex flex-col items-center gap-4 sm:gap-5 text-center px-4">
      <Link href="/" className="transition-transform hover:scale-105">
        <Image
          src="/ute-logo.png"
          alt="HCMUTE Logo"
          width={56}
          height={56}
          className="rounded-xl"
        />
      </Link>
      <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
        Thực hiện bởi Phòng Quản trị Thương hiệu &amp; Truyền thông
        <br />
        Trường Đại học Sư phạm Kỹ thuật TP. Hồ Chí Minh
      </p>
    </div>
  );

  if (animate) {
    return (
      <motion.footer
        className={cn("relative z-10 border-t border-border/40 py-8 sm:py-10 mt-auto", className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: animationDelay }}
      >
        {content}
      </motion.footer>
    );
  }

  return (
    <footer className={cn("relative z-10 border-t border-border/40 py-8 sm:py-10 mt-auto", className)}>
      {content}
    </footer>
  );
}

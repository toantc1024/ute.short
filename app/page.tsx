"use client";

import { useState, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { UrlForm } from "@/components/url-form";
import { UrlsTable } from "@/components/urls-table";
import { Button } from "@/components/ui/button";
import { GridPattern } from "@/components/ui/grid-pattern";
import { motion } from "framer-motion";
import { AuroraText } from "@/components/ui/aurora-text";
import { cn } from "@/lib/utils";
import { useLocalStorageMigration } from "@/hooks/use-local-storage-migration";

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function HomePage() {
  const { data: session, status } = useSession();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUrlCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Auto-claim links from localStorage when user logs in
  useLocalStorageMigration(handleUrlCreated);

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Background Grid */}
      <div className="absolute z-[-1] flex h-[300px] sm:h-[400px] lg:h-[500px] w-full flex-col items-center justify-center rounded-lg">
        <GridPattern
          squares={[
            [4, 4],
            [5, 1],
            [8, 2],
            [5, 3],
            [5, 5],
            [10, 10],
            [12, 15],
            [10, 15],
          ]}
          className={cn(
            "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)] sm:[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
            "inset-x-0 inset-y-[10%] h-[200%] skew-y-12"
          )}
        />
      </div>

      {/* Navbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease }}
      >
        <Navbar />
      </motion.div>

      <main className="container flex-1 pt-32 pb-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-6">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-3">
            {/* HCMUTE - First */}
            <motion.span
              className="inline-block px-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0, ease }}
            >
              <AuroraText>HCMUTE</AuroraText>
            </motion.span>

            {/* S-Link - Second */}
            <motion.span
              className="inline-block px-2 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease }}
            >
              S-Link &amp; QR Code
            </motion.span>
          </h1>

          {/* Subtitle - Third */}
          <motion.p
            className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto whitespace-nowrap"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
          >
            Rút gọn liên kết và tạo mã QR dễ dàng
          </motion.p>
        </div>

        {/* URL Form - Fourth */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease }}
        >
          {status === "loading" ? (
            <div className="w-full max-w-2xl mx-auto h-14 rounded-full bg-muted/50 animate-pulse" />
          ) : session ? (
            <UrlForm onUrlCreated={handleUrlCreated} />
          ) : (
            <div className="w-full max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-6 rounded-3xl bg-card/80 backdrop-blur border border-border/50">
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-lg mb-1">
                    Đăng nhập để bắt đầu
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Tạo và quản lý liên kết rút gọn của riêng bạn
                  </p>
                </div>
                <Button
                  onClick={() => signIn("google")}
                  className="rounded-full px-6 bg-primary hover:bg-primary/90 transition-all"
                >
                  Đăng nhập với Google
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* URLs Table - Last */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease }}
          >
            <UrlsTable refreshTrigger={refreshTrigger} />
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <Footer animate animationDelay={0.6} />
    </div>
  );
}
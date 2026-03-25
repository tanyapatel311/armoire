import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-gradient-to-br from-mint/20 via-blush/10 to-mint/10 min-h-[calc(100vh-4rem)]">{children}</main>
      <Toaster position="top-right" />
    </>
  );
}

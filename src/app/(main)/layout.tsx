import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { GuestProvider } from "@/lib/guest-context";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestProvider>
      <Navbar />
      <main
        className="flex-1 min-h-[calc(100vh-4rem)]"
        style={{
          backgroundImage: "url('/bg-texture.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {children}
      </main>
      <Toaster position="top-right" />
    </GuestProvider>
  );
}

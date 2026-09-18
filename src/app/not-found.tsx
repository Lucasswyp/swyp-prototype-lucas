import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center text-center px-6 bg-[radial-gradient(circle_at_50%_0%,rgba(123,61,255,0.25),transparent_60%)]">
      <Logo size="lg" className="mb-6" />
      <p className="font-heading text-6xl font-extrabold mb-3">404</p>
      <h1 className="font-heading text-xl font-bold mb-2">Deze pagina bestaat niet</h1>
      <p className="text-white/50 text-sm mb-8 max-w-xs">
        De pagina die je zoekt is verplaatst, verwijderd of heeft nooit bestaan.
      </p>
      <Link href="/">
        <Button>Terug naar home</Button>
      </Link>
    </div>
  );
}

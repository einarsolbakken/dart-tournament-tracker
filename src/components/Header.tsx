import { Link } from "react-router-dom";
import dartArenaLogo from "@/assets/dart-arena-logo.svg";

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <Link to="/" className="flex items-center gap-3 w-fit">
          <img src={dartArenaLogo} alt="DartArena" className="h-8 w-auto" />
        </Link>
      </div>
    </header>
  );
}

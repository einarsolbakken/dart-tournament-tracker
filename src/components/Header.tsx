import { Link } from "react-router-dom";
import dartArenaLogo from "@/assets/dartarena-logo.png";

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <Link to="/" className="flex items-center gap-3 w-fit">
          <img src={dartArenaLogo} alt="DartArena" className="w-10 h-10" />
          <span className="font-display text-2xl tracking-wide">DARTARENA</span>
        </Link>
      </div>
    </header>
  );
}

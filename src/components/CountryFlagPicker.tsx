import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Common countries with their flag emojis and names
const COUNTRIES = [
  { code: "NO", name: "Norge", flag: "🇳🇴" },
  { code: "SE", name: "Sverige", flag: "🇸🇪" },
  { code: "DK", name: "Danmark", flag: "🇩🇰" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "GB", name: "Storbritannia", flag: "🇬🇧" },
  { code: "NL", name: "Nederland", flag: "🇳🇱" },
  { code: "DE", name: "Tyskland", flag: "🇩🇪" },
  { code: "BE", name: "Belgia", flag: "🇧🇪" },
  { code: "IE", name: "Irland", flag: "🇮🇪" },
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "FR", name: "Frankrike", flag: "🇫🇷" },
  { code: "ES", name: "Spania", flag: "🇪🇸" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "AT", name: "Østerrike", flag: "🇦🇹" },
  { code: "CH", name: "Sveits", flag: "🇨🇭" },
  { code: "PL", name: "Polen", flag: "🇵🇱" },
  { code: "CZ", name: "Tsjekkia", flag: "🇨🇿" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "HU", name: "Ungarn", flag: "🇭🇺" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "GR", name: "Hellas", flag: "🇬🇷" },
  { code: "HR", name: "Kroatia", flag: "🇭🇷" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "LT", name: "Litauen", flag: "🇱🇹" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "EE", name: "Estland", flag: "🇪🇪" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "CN", name: "Kina", flag: "🇨🇳" },
  { code: "KR", name: "Sør-Korea", flag: "🇰🇷" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ZA", name: "Sør-Afrika", flag: "🇿🇦" },
  { code: "IS", name: "Island", flag: "🇮🇸" },
];

interface CountryFlagPickerProps {
  value?: string;
  onChange: (countryCode: string) => void;
  className?: string;
}

export function CountryFlagPicker({ value, onChange, className }: CountryFlagPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const selectedCountry = COUNTRIES.find(c => c.code === value);
  
  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    country.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 text-lg hover:bg-muted/50 transition-all",
            !value && "text-muted-foreground",
            className
          )}
          title="Velg nasjonalitet"
        >
          {selectedCountry ? selectedCountry.flag : "🏳️"}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-0 bg-popover border border-border shadow-lg z-50" 
        align="end"
        sideOffset={4}
      >
        <div className="p-2 border-b border-border">
          <Input
            placeholder="Søk land..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <ScrollArea className="h-64">
          <div className="p-1">
            {/* Option to clear selection */}
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setSearch("");
              }}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                "hover:bg-muted/50",
                !value && "bg-primary/10"
              )}
            >
              <span className="text-lg">🏳️</span>
              <span className="text-muted-foreground">Ingen nasjonalitet</span>
            </button>
            
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  "hover:bg-muted/50",
                  value === country.code && "bg-primary/10"
                )}
              >
                <span className="text-lg">{country.flag}</span>
                <span>{country.name}</span>
              </button>
            ))}
            
            {filteredCountries.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Ingen land funnet
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function getCountryFlag(code: string): string {
  const country = COUNTRIES.find(c => c.code === code);
  return country?.flag || "";
}

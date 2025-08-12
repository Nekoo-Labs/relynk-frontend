import { LogOut, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import SwitchNetwork from "./ui/switch-network";
import { Button } from "./ui/button";

export default function DashboardHeaderSheet({
  address,
  logout,
}: {
  address: string | undefined;
  logout: () => void;
}) {
  return (
    <Sheet>
      <SheetTrigger className="sm:hidden">Open</SheetTrigger>
      <SheetContent>
        <div className="flex flex-col items-center gap-3 py-16 px-4">
          <SwitchNetwork variant="neutral" size="sm" className="w-full" />
          <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-base bg-secondary-background/50 border border-border">
            <User className="h-4 w-4 text-foreground/60" />
            <span className="text-sm text-center mx-auto text-foreground/80 font-mono">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
            </span>
          </div>
          <Button
            variant="neutral"
            size="sm"
            onClick={logout}
            className="glow-hover hover:scale-105 transition-all duration-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

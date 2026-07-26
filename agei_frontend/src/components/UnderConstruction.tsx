import { Construction } from "lucide-react";

export function UnderConstruction() {
  return (
    <div className="bg-warning/20 border-b border-warning text-warning-foreground px-4 py-2 flex items-center justify-center text-sm font-medium">
      <Construction className="h-4 w-4 mr-2 text-warning" />
      <span className="text-foreground">This site is currently under construction. Features and documentation are subject to change.</span>
    </div>
  );
}

import { TreePine } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <TreePine className="h-4 w-4" />
          <span>Vin Furniture © 2026</span>
        </div>
        <p>Nội thất gỗ tự nhiên cao cấp</p>
      </div>
    </footer>
  );
}

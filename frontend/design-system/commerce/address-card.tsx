import { cn } from "@/lib/utils";
import { Badge } from "../components/badge";

export interface AddressViewModel {
  id: string;
  recipientName: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

interface AddressCardProps {
  address: AddressViewModel;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
  defaultLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  setDefaultLabel?: string;
  className?: string;
}

export function AddressCard({
  address, selected, onSelect, onEdit, onDelete, onSetDefault,
  defaultLabel = "Default", editLabel = "Edit", deleteLabel = "Delete", setDefaultLabel = "Set as default",
  className,
}: AddressCardProps) {
  const formatted = [address.addressLine, address.ward, address.district, address.province].filter(Boolean).join(", ");

  return (
    <div
      className={cn(
        "rounded-md border p-4 transition-colors",
        selected ? "border-brand ring-1 ring-brand bg-brand-soft/30" : "border-border-default bg-surface",
        onSelect && "cursor-pointer hover:border-border-strong",
        className
      )}
      onClick={onSelect ? () => onSelect(address.id) : undefined}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? (e) => e.key === "Enter" && onSelect(address.id) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary">{address.recipientName}</p>
            {address.isDefault && <Badge variant="success">{defaultLabel}</Badge>}
          </div>
          <p className="text-sm text-text-secondary">{address.phone}</p>
          <p className="text-sm text-text-muted">{formatted}</p>
        </div>

        {(onEdit || onDelete || onSetDefault) && (
          <div className="flex items-center gap-3 text-xs shrink-0">
            {!address.isDefault && onSetDefault && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onSetDefault(address.id); }}
                className="text-brand hover:text-brand-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
              >
                {setDefaultLabel}
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(address.id); }}
                className="text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
              >
                {editLabel}
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(address.id); }}
                className="text-danger hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
              >
                {deleteLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

export function TableScroll({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0", className)}>
      <div className="min-w-full">{children}</div>
    </div>
  );
}

export interface DataTableColumn<T> {
  /** Column header text — also used as the mobile card label. */
  header: string;
  /** Cell content. Falls back to `String(row[key])` when omitted. */
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
  /** Hide this column in the mobile card view. */
  secondary?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Rendered below 768px instead of the table. */
  renderCard?: (row: T) => React.ReactNode;
  /** Table caption for screen readers. */
  caption: string;
  empty?: React.ReactNode;
  className?: string;
}

/**
 * One component, two presentations: a real table from 768px up and stacked
 * cards below it, so admin lists never cause horizontal page scroll on phones.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  renderCard,
  caption,
  empty,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className={cn("overflow-hidden rounded-card border border-border bg-surface", className)}>
      {/* desktop / tablet */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="border-b border-border bg-surface-muted/60">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.header}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap px-3 py-3 text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6",
                      column.align === "right" && "text-right",
                      column.align === "center" && "text-center",
                    )}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={rowKey(row)} className="transition-colors hover:bg-surface-muted/50">
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={cn(
                        "px-3 py-3.5 align-middle first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.className,
                      )}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* phone */}
      {renderCard ? (
        <ul className="divide-y divide-border md:hidden">
          {rows.map((row) => (
            <li key={rowKey(row)}>{renderCard(row)}</li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-border md:hidden">
          {rows.map((row) => (
            <li key={rowKey(row)} className="px-5 py-4">
              <dl className="space-y-2">
                {columns
                  .filter((column) => !column.secondary)
                  .map((column) => (
                    <div key={column.header} className="flex items-start justify-between gap-4">
                      <dt className="text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground">
                        {column.header}
                      </dt>
                      <dd className="text-right text-sm font-medium">{column.cell(row)}</dd>
                    </div>
                  ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

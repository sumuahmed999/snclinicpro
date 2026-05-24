import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  mobileCardRender?: (item: T) => ReactNode;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No data available',
  mobileCardRender,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-20 card animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cream-500 mb-6">
          <svg
            className="h-10 w-10 text-sage-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-xl font-display font-bold text-primary-500 mb-2">{emptyMessage}</h3>
        <p className="text-sage-600">Get started by adding your first item</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block card overflow-hidden animate-fade-in">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-sage-200">
            <thead className="bg-cream-500">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-6 py-4 text-left text-xs font-bold text-primary-500 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-beige-200">
              {data.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-beige-50 transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-charcoal-600 font-medium"
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item, index) => (
          <div
            key={keyExtractor(item)}
            className="card p-5 space-y-3 border border-beige-300 animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {mobileCardRender ? (
              mobileCardRender(item)
            ) : (
              <>
                {columns
                  .filter((col) => !col.hideOnMobile)
                  .map((column) => (
                    <div key={column.key} className="flex justify-between items-start gap-4">
                      <span className="text-sm font-bold text-sage-600 flex-shrink-0 min-w-[110px]">
                        {column.label}
                      </span>
                      <span className="text-sm text-charcoal-600 font-medium flex-1 text-right">
                        {column.render(item)}
                      </span>
                    </div>
                  ))}
              </>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

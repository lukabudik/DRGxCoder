'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown, MoreHorizontal, Check, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NewPredictionDialog } from './new-prediction-dialog';
import { PredictionDetailSheet } from './prediction-detail-sheet';
import { SearchFilters } from './search-filters';
import styles from './predictions-database.module.css';

type Prediction = {
  id: string;
  pac_id: string;
  main_code: string;
  main_name: string;
  main_confidence: number;
  validated: boolean;
  created_at: string;
};

const getStatusBadge = (validated: boolean) => {
  if (validated) {
    return <Badge variant="success">Approved</Badge>;
  }
  return <Badge variant="default">Pending</Badge>;
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'text-green-600';
  if (confidence >= 0.7) return 'text-amber-600';
  return 'text-red-600';
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export function PredictionsDatabase() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const { data: predictionsData, isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => api.listPredictions({ page: 1, limit: 50 }),
    refetchInterval: 10000,
  });

  const predictions = (predictionsData?.predictions || []) as Prediction[];

  // Define columns
  const columns = useMemo<ColumnDef<Prediction>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'patient',
        header: 'Patient',
        cell: ({ row }) => {
          const patient = row.original.case?.patient;
          if (!patient) return (
            <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              {row.original.pac_id || 'N/A'}
            </span>
          );
          return (
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
              {patient.last_name}, {patient.first_name}
            </span>
          );
        },
      },
      {
        id: 'patient_age',
        header: 'Age',
        cell: ({ row }) => {
          const patient = row.original.case?.patient;
          if (!patient?.date_of_birth) return <span style={{ color: 'var(--color-text-secondary)' }}>-</span>;
          const age = Math.floor(
            (new Date().getTime() - new Date(patient.date_of_birth).getTime()) / 
            (1000 * 60 * 60 * 24 * 365.25)
          );
          return (
            <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
              {age}
            </span>
          );
        },
        size: 60,
      },
      {
        id: 'patient_sex',
        header: 'Sex',
        cell: ({ row }) => {
          const sex = row.original.case?.patient?.sex;
          return (
            <span style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
              {sex || '-'}
            </span>
          );
        },
        size: 50,
      },
      {
        accessorKey: 'main_code',
        header: ({ column }) => {
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                fontWeight: 'inherit',
                fontSize: 'inherit',
                padding: 0,
              }}
            >
              Diagnosis
              <ArrowUpDown style={{ width: '14px', height: '14px', opacity: 0.5 }} />
            </button>
          );
        },
        cell: ({ row }) => (
          <div className={styles.diagnosisCell}>
            <code className={styles.codeCell}>{row.getValue('main_code')}</code>
            <span className={styles.diagnosisName}>{row.original.main_name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'main_confidence',
        header: ({ column }) => {
          return (
            <button
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                fontWeight: 'inherit',
                fontSize: 'inherit',
                padding: 0,
              }}
            >
              Confidence
              <ArrowUpDown style={{ width: '14px', height: '14px', opacity: 0.5 }} />
            </button>
          );
        },
        cell: ({ row }) => {
          const confidence = row.getValue('main_confidence') as number;
          return (
            <span
              style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}
              className={getConfidenceColor(confidence)}
            >
              {Math.round(confidence * 100)}%
            </span>
          );
        },
      },
      {
        accessorKey: 'validated',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.getValue('validated')),
        filterFn: (row, id, value) => {
          if (value === 'all') return true;
          if (value === 'approved') return row.getValue(id) === true;
          if (value === 'pending') return row.getValue(id) === false;
          return true;
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 400 }}>
            {formatDate(row.getValue('created_at'))}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  style={{
                    padding: '4px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-secondary)',
                    transition: 'background 0.15s ease',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onFocus={(e) => e.currentTarget.style.outline = 'none'}
                >
                  <MoreHorizontal size={16} />
                  <span className="sr-only">Open menu</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    console.log('Approve', row.original.id);
                    // TODO: Call approve API
                  }}
                >
                  <Check size={14} className="text-green-600" />
                  <span>Approve</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    console.log('Reject', row.original.id);
                    // TODO: Call reject API
                  }}
                >
                  <X size={14} className="text-red-600" />
                  <span>Reject</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: predictions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className="flex items-center gap-4">
            <h1 className={styles.title}>DRGxCoder</h1>
            <span className="text-gray-300">|</span>
            <p className={styles.subtitle}>
              {table.getFilteredRowModel().rows.length} {table.getFilteredRowModel().rows.length === 1 ? 'Prediction' : 'Predictions'}
            </p>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Prediction
          </Button>
        </div>
      </header>

      <main className={styles.main}>
        <SearchFilters
          onSearchChange={(query) => {
            table.getColumn('pac_id')?.setFilterValue(query);
            table.getColumn('main_code')?.setFilterValue(query);
          }}
          onStatusChange={(status) => {
            table.getColumn('validated')?.setFilterValue(status);
          }}
          onClearFilters={() => {
            table.resetColumnFilters();
          }}
          activeFiltersCount={columnFilters.length}
        />

        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'var(--color-primary-light)',
              border: '1px solid rgba(94, 106, 210, 0.2)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 500 }}>
              {table.getFilteredSelectedRowModel().rows.length} row(s) selected
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
                  console.log('Bulk approve:', selectedIds);
                  // TODO: Call bulk approve API
                  table.toggleAllRowsSelected(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={14} />
                Approve All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
                  console.log('Bulk reject:', selectedIds);
                  // TODO: Call bulk reject API
                  table.toggleAllRowsSelected(false);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <X size={14} />
                Reject All
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loading}>Loading predictions...</div>
        ) : predictions.length === 0 ? (
          <div className={styles.empty}>
            <p>No predictions yet. Create your first one!</p>
            <Button onClick={() => setIsNewDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              New Prediction
            </Button>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => setSelectedPredictionId(row.original.id)}
                      className={styles.clickableRow}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <NewPredictionDialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen} />
      <PredictionDetailSheet
        predictionId={selectedPredictionId}
        open={!!selectedPredictionId}
        onOpenChange={(open) => !open && setSelectedPredictionId(null)}
      />
    </div>
  );
}

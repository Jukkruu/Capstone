'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { STATUS_COLORS } from '@/types';

const SPEC_ROWS = [
  { label: 'Category', key: 'category' },
  { label: 'Subcategory', key: 'subCategory' },
  { label: 'Brand', key: 'brand' },
  { label: 'Model', key: 'model' },
  { label: 'Country of Origin', key: 'countryOfOrigin' },
  { label: 'Capacity', key: 'capacity' },
  { label: 'Power Requirement', key: 'powerRequirement' },
  { label: 'Dimensions', key: 'dimensions' },
  { label: 'Standards', key: 'standards' },
  { label: 'Operating Condition', key: 'operatingCondition' },
];

const COMMERCIAL_ROWS = [
  { label: 'Purchase Price (THB)', key: 'purchasePrice', currency: true },
  { label: 'Useful Life (years)', key: 'usefulLifeYr' },
  { label: 'Energy (kWh/hr)', key: 'energyKwhPerHr' },
  { label: 'Hours/Year', key: 'hoursPerYear' },
  { label: 'Maintenance Cost (THB/yr)', key: 'maintCostPerYear', currency: true },
  { label: 'Consumable Cost (THB/yr)', key: 'consumableCostPerYear', currency: true },
  { label: 'TCO (THB)', key: 'tcoTotal', currency: true, highlight: true },
  { label: 'CO₂/Year (tonnes)', key: 'co2PerYear' },
  { label: 'CO₂ Lifetime (tonnes)', key: 'co2Lifetime' },
  { label: 'Carbon Credit Value (THB)', key: 'carbonCreditValue', currency: true },
];

const WARRANTY_ROWS = [
  { label: 'Warranty Start', key: 'warrantyStart', isDate: true },
  { label: 'Warranty End', key: 'warrantyEnd', isDate: true },
  { label: 'Scope', key: 'warrantyScope' },
  { label: 'Condition', key: 'warrantyCondition' },
  { label: 'SLA Response (hr)', key: 'slaResponseHr' },
  { label: 'SLA Restore (hr)', key: 'slaRestoreHr' },
  { label: 'Service Center', key: 'serviceCenter' },
  { label: 'Training', key: 'training' },
];

function fmt(val: any, currency?: boolean, isDate?: boolean): string {
  if (val == null || val === '') return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (isDate) return new Date(val).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  if (currency && !isNaN(Number(val))) return Number(val).toLocaleString('en-US');
  return String(val);
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading comparison…</div>}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const params = useSearchParams();
  const ids = (params.get('ids') || '').split(',').filter(Boolean);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ids.length) { setLoading(false); return; }
    api.get(`/api/equipment/compare?ids=${ids.join(',')}`).then(r => {
      setItems(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Loading comparison…</div>;
  if (!items.length) return (
    <div className="p-8 text-center text-gray-500">
      No items to compare. <Link href="/equipment" className="text-green-700 hover:underline">Go back to Equipment list.</Link>
    </div>
  );

  const numericVals = (key: string) => items.map(i => Number(i[key])).filter(v => !isNaN(v) && v > 0);
  const bestLow = (key: string) => { const v = numericVals(key); return v.length >= 2 ? String(Math.min(...v)) : null; };

  const cols = items.length;

  const Section = ({
    title,
    rows,
    source,
  }: {
    title: string;
    rows: { label: string; key: string; currency?: boolean; highlight?: boolean; isDate?: boolean }[];
    source?: 'warranty';
  }) => (
    <div className="mb-6">
      <div className="grid" style={{ gridTemplateColumns: `200px repeat(${cols}, 1fr)` }}>
        <div className="bg-gray-100 px-4 py-2.5 font-semibold text-gray-700 text-sm rounded-tl-lg">{title}</div>
        {items.map((_, i) => (
          <div key={i} className={`px-4 py-2.5 bg-gray-50 border-l border-gray-200 ${i === cols - 1 ? 'rounded-tr-lg' : ''}`} />
        ))}

        {rows.map((row, ri) => (
          <>
            <div key={`lbl-${ri}`} className="px-4 py-2.5 text-xs font-medium text-gray-500 bg-white border-t border-gray-100">
              {row.label}
            </div>
            {items.map((item, ii) => {
              const raw = source === 'warranty'
                ? (Array.isArray(item.warranty) ? item.warranty[0]?.[row.key] : item.warranty?.[row.key])
                : item[row.key];
              const display = fmt(raw, row.currency, row.isDate);
              const best = row.key === 'tcoTotal' ? bestLow('tcoTotal')
                          : row.key === 'co2PerYear' ? bestLow('co2PerYear')
                          : null;
              const isBest = best != null && raw != null && Math.abs(Number(raw) - Number(best)) < 0.0001;
              return (
                <div key={`val-${ri}-${ii}`}
                  className={`px-4 py-2.5 text-sm border-t border-l border-gray-100 ${row.highlight ? 'font-semibold' : ''} ${isBest ? 'bg-green-50 text-green-800' : 'bg-white'}`}>
                  {display}
                  {isBest && <span className="ml-1 text-xs text-green-600 font-normal">✓ best</span>}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-sm text-gray-500 mb-1">
            <Link href="/equipment" className="hover:text-green-700">Equipment</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Compare</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Side-by-Side Comparison</h1>
          <p className="text-gray-500 text-sm mt-0.5">Comparing {items.length} assets</p>
        </div>
        <Link href="/equipment" className="text-sm text-gray-600 hover:text-green-700 border border-gray-200 px-3 py-1.5 rounded-lg">
          ← Back
        </Link>
      </div>

      {/* Asset headers */}
      <div className="grid mb-4" style={{ gridTemplateColumns: `200px repeat(${cols}, 1fr)` }}>
        <div />
        {items.map(item => (
          <div key={item.id} className="px-4 py-4 bg-white border border-gray-200 rounded-xl mx-1 shadow-sm">
            <Link href={`/equipment/${item.id}`} className="font-semibold text-gray-900 hover:text-green-700 text-sm block">
              {item.nameEn}
            </Link>
            <div className="text-xs text-gray-400 mt-0.5">{item.brand} {item.model}</div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.submissionStatus as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-600'}`}>
                {item.submissionStatus?.replace('_', ' ')}
              </span>
            </div>
            {item.supplier && <div className="text-xs text-gray-500 mt-1.5">{item.supplier.name}</div>}
          </div>
        ))}
      </div>

      <Section title="Specifications" rows={SPEC_ROWS} />
      <Section title="Commercial & TCO" rows={COMMERCIAL_ROWS} />
      <Section title="Warranty" rows={WARRANTY_ROWS} source="warranty" />
    </div>
  );
}

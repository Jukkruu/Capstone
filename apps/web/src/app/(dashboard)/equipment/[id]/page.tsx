'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { STATUS_COLORS } from '@/types';

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const user = session?.user as any;
  const router = useRouter();

  const [eq, setEq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/api/equipment/${id}`).then(r => { setEq(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async (action: string, body?: object) => {
    setActionLoading(true);
    setError('');
    try {
      await api.post(`/api/equipment/${id}/${action}`, body || {});
      load();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>;
  if (!eq) return <div className="p-8 text-gray-400">Equipment not found.</div>;

  const isGcpOrAdmin = user?.role === 'GCP' || user?.role === 'ADMIN';
  const canApprove = isGcpOrAdmin && eq.submissionStatus === 'PENDING_REVIEW';
  const canReject = isGcpOrAdmin && ['PENDING_REVIEW', 'APPROVED'].includes(eq.submissionStatus);
  const canNominate = isGcpOrAdmin && eq.submissionStatus === 'APPROVED';
  const canQueue = (user?.role === 'ADMIN' || user?.role === 'EDITOR') && eq.submissionStatus === 'NOMINATED';

  const warranty = Array.isArray(eq.warranty) ? eq.warranty[0] : eq.warranty;

  const Field = ({ label, value }: { label: string; value?: string | number | null }) =>
    value != null && value !== '' ? (
      <div>
        <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</dt>
        <dd className="text-sm text-gray-900 mt-0.5">{String(value)}</dd>
      </div>
    ) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link href="/equipment" className="hover:text-green-700">Equipment</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{eq.nameEn}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{eq.nameEn}</h1>
          {eq.nameTh && <p className="text-gray-500 mt-0.5">{eq.nameTh}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[eq.submissionStatus as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-600'}`}>
              {eq.submissionStatus?.replace('_', ' ')}
            </span>
            {eq.tagNumber && <span className="text-xs text-gray-400 font-mono">{eq.tagNumber}</span>}
            {eq.category && <span className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5">{eq.category}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2 flex-wrap justify-end">
            {canApprove && (
              <button disabled={actionLoading} onClick={() => doAction('approve')}
                className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg font-medium hover:bg-green-800 disabled:opacity-50">
                Approve
              </button>
            )}
            {canReject && (
              <button disabled={actionLoading} onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                Reject
              </button>
            )}
            {canNominate && (
              <button disabled={actionLoading} onClick={() => doAction('nominate')}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
                Nominate Winner
              </button>
            )}
            {canQueue && (
              <button disabled={actionLoading} onClick={() => doAction('queue')}
                className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50">
                Queue for Sync
              </button>
            )}
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>

      {eq.returnReason && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          <span className="font-semibold">Rejection reason:</span> {eq.returnReason}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Specifications */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Specifications</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Brand" value={eq.brand} />
              <Field label="Model" value={eq.model} />
              <Field label="Sub-model" value={eq.subModel} />
              <Field label="Subcategory" value={eq.subCategory} />
              <Field label="Country of Origin" value={eq.countryOfOrigin} />
              <Field label="Product Series" value={eq.productSeries} />
              <Field label="Serial No." value={eq.serialNo} />
              <Field label="Capacity" value={eq.capacity} />
              <Field label="Power Requirement" value={eq.powerRequirement} />
              <Field label="Utility Requirement" value={eq.utilityRequirement} />
              <Field label="Dimensions" value={eq.dimensions} />
              <Field label="Operating Condition" value={eq.operatingCondition} />
              <Field label="Standards" value={eq.standards} />
              <Field label="Functional Reqs" value={eq.functionalReqs} />
              <Field label="Short Spec" value={eq.shortSpec} />
            </dl>
          </section>

          {/* Commercial & Lifecycle */}
          <section className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Commercial & Lifecycle</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Purchase Price (THB)" value={eq.purchasePrice != null ? Number(eq.purchasePrice).toLocaleString() : null} />
              <Field label="Useful Life (years)" value={eq.usefulLifeYr} />
              <Field label="Economic Life (years)" value={eq.economicLifeYr} />
              <Field label="Energy (kWh/hr)" value={eq.energyKwhPerHr} />
              <Field label="Hours/Year" value={eq.hoursPerYear} />
              <Field label="Maintenance Cost (THB/yr)" value={eq.maintCostPerYear != null ? Number(eq.maintCostPerYear).toLocaleString() : null} />
              <Field label="Consumable Cost (THB/yr)" value={eq.consumableCostPerYear != null ? Number(eq.consumableCostPerYear).toLocaleString() : null} />
              <Field label="Residual Value (%)" value={eq.residualValuePct} />
              <Field label="Price Escalation (%)" value={eq.priceEscalationPct} />
              <Field label="Design Life" value={eq.designLife} />
              <Field label="End of Support Year" value={eq.endOfSupportYr} />
              <Field label="Disposal Guide" value={eq.disposalGuide} />
            </dl>
          </section>

          {/* TCO & Carbon */}
          {(eq.tcoTotal != null || eq.co2PerYear != null) && (
            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 mb-4">TCO & Carbon (Auto-calculated)</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Field label="TCO (THB)" value={eq.tcoTotal != null ? Number(eq.tcoTotal).toLocaleString() : null} />
                <Field label="CO₂/Year (tonnes)" value={eq.co2PerYear != null ? Number(eq.co2PerYear).toFixed(3) : null} />
                <Field label="CO₂ Lifetime (tonnes)" value={eq.co2Lifetime != null ? Number(eq.co2Lifetime).toFixed(3) : null} />
                <Field label="Carbon Credit Value (THB)" value={eq.carbonCreditValue != null ? Number(eq.carbonCreditValue).toLocaleString() : null} />
              </dl>
            </section>
          )}

          {/* BOM */}
          {eq.bom && eq.bom.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Bill of Materials ({eq.bom.length} items)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="py-2 pr-4 font-semibold text-gray-500 text-xs uppercase">Part Name</th>
                      <th className="py-2 pr-4 font-semibold text-gray-500 text-xs uppercase">Part No.</th>
                      <th className="py-2 pr-4 font-semibold text-gray-500 text-xs uppercase">Category</th>
                      <th className="py-2 pr-4 font-semibold text-gray-500 text-xs uppercase">Qty</th>
                      <th className="py-2 pr-4 font-semibold text-gray-500 text-xs uppercase">Critical</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {eq.bom.map((b: any) => (
                      <tr key={b.id}>
                        <td className="py-2 pr-4">{b.part?.name || '—'}</td>
                        <td className="py-2 pr-4 text-gray-500 font-mono text-xs">{b.part?.partNumber || '—'}</td>
                        <td className="py-2 pr-4 text-gray-500">{b.part?.category || '—'}</td>
                        <td className="py-2 pr-4">{b.quantityRequired}</td>
                        <td className="py-2 pr-4 text-gray-500">{b.isCritical ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Supplier */}
          {eq.supplier && (
            <section className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Vendor</h3>
              <dl className="space-y-2">
                <Field label="Company" value={eq.supplier.name} />
                <Field label="Code" value={eq.supplier.supplierCode} />
                <Field label="Email" value={eq.supplier.contactEmail} />
              </dl>
            </section>
          )}

          {/* Warranty */}
          {warranty && (
            <section className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Warranty</h3>
              <dl className="space-y-2">
                <Field label="Start Date" value={warranty.warrantyStart ? new Date(warranty.warrantyStart).toLocaleDateString('en-GB') : null} />
                <Field label="End Date" value={warranty.warrantyEnd ? new Date(warranty.warrantyEnd).toLocaleDateString('en-GB') : null} />
                <Field label="Scope" value={warranty.warrantyScope} />
                <Field label="Condition" value={warranty.warrantyCondition} />
                <Field label="SLA Response (hr)" value={warranty.slaResponseHr} />
                <Field label="SLA Restore (hr)" value={warranty.slaRestoreHr} />
                <Field label="Service Center" value={warranty.serviceCenter} />
                <Field label="Training" value={warranty.training} />
                <Field label="Extended Warranty" value={warranty.extendedWarrantyOption} />
              </dl>
            </section>
          )}

          {/* CMS Mapping */}
          {isGcpOrAdmin && (
            <section className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">CMS Mapping</h3>
              <dl className="space-y-2">
                <Field label="Asset Type" value={eq.assetType?.id ? `${eq.assetType.id} – ${eq.assetType.name}` : null} />
                <Field label="Service Type" value={eq.serviceType?.id ? `${eq.serviceType.id} – ${eq.serviceType.name}` : null} />
                <Field label="Criticality" value={eq.criticality} />
                <Field label="Record Status" value={eq.recordStatus} />
              </dl>
              {!eq.assetTypeId && (
                <p className="text-xs text-amber-600 mt-2">Asset/Service type not mapped yet.</p>
              )}
            </section>
          )}

          {/* Sync Info */}
          {(user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
            <section className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Sync Status</h3>
              <dl className="space-y-2">
                <Field label="Record Status" value={eq.recordStatus} />
                <Field label="CMS Sync" value={eq.cmsSyncStatus || 'Not synced'} />
                <Field label="FA Sync" value={eq.faSyncStatus || 'Not synced'} />
              </dl>
            </section>
          )}

          {/* Timestamps */}
          <section className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <h3 className="font-semibold text-gray-500 mb-3 text-xs uppercase tracking-wide">Timeline</h3>
            <dl className="space-y-2">
              <Field label="Submitted" value={new Date(eq.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
              {eq.nominatedAt && <Field label="Nominated" value={new Date(eq.nominatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />}
              {eq.nominatedBy && <Field label="Nominated By" value={eq.nominatedBy} />}
            </dl>
          </section>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Reject Submission</h3>
            <p className="text-gray-500 text-sm mb-4">Provide a reason so the vendor can address the issues.</p>
            <textarea
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              rows={4}
              placeholder="e.g. Missing power specifications, please resubmit with complete electrical data."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                Cancel
              </button>
              <button
                disabled={!returnReason.trim() || actionLoading}
                onClick={() => { doAction('reject', { reason: returnReason }); setShowRejectModal(false); }}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

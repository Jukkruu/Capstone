'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/types';

const SECTIONS = [
  { id: 1, label: 'Supplier & Specs' },
  { id: 2, label: 'Warranty & Parts' },
  { id: 3, label: 'Lifecycle & TCO' },
];

// Fields hidden per category
const HIDDEN_BY_CAT: Record<string, string[]> = {
  'Super Equipment': ['utilityRequirement', 'operatingCondition'],
  'General Home Use Equipment': ['utilityRequirement', 'operatingCondition', 'endOfSupportYr', 'disposalGuide', 'minStockRecommend'],
  'Shopping Trolley': ['capacity', 'powerRequirement', 'utilityRequirement', 'operatingCondition',
    'warrantyStart', 'warrantyEnd', 'warrantyScope', 'warrantyCondition', 'extendedWarrantyOption',
    'slaResponseHr', 'slaRestoreHr', 'serviceCenter', 'training',
    'spPartNo', 'spPartName', 'spClassification', 'replacementInterval', 'minStockRecommend',
    'usefulLifeYr', 'hoursPerYear', 'designLife', 'economicLifeYr', 'overhaul', 'residualValuePct',
    'endOfSupportYr', 'disposalGuide', 'maintCostPerYear', 'pmPackagePrice', 'consumableCostPerYear',
    'laborRate', 'energyKwhPerHr', 'tcoTotal', 'priceEscalationPct',
    'emissionFactor', 'carbonCreditPrice'],
  'Small Equipment': ['capacity', 'powerRequirement', 'utilityRequirement', 'operatingCondition',
    'warrantyStart', 'warrantyEnd', 'warrantyScope', 'warrantyCondition', 'extendedWarrantyOption',
    'slaResponseHr', 'slaRestoreHr', 'serviceCenter', 'training',
    'spPartNo', 'spPartName', 'spClassification', 'replacementInterval', 'minStockRecommend',
    'usefulLifeYr', 'hoursPerYear', 'designLife', 'economicLifeYr', 'overhaul', 'residualValuePct',
    'endOfSupportYr', 'disposalGuide', 'maintCostPerYear', 'pmPackagePrice', 'consumableCostPerYear',
    'laborRate', 'energyKwhPerHr', 'tcoTotal', 'priceEscalationPct',
    'emissionFactor', 'carbonCreditPrice'],
};

type FormData = Record<string, any>;

export default function PublicSubmitPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));
  const hidden = (key: string) => (HIDDEN_BY_CAT[form.category] || []).includes(key);

  const Field = ({ label, id, type = 'text', required = false, placeholder = '', options = [] as string[], hint = '' }: { label: string; id: string; type?: string; required?: boolean; placeholder?: string; options?: string[]; hint?: string }) => {
    if (hidden(id)) return null;
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {type === 'select' ? (
          <select
            value={form[id] || ''}
            onChange={e => set(id, e.target.value)}
            required={required}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select…</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={form[id] || ''}
            onChange={e => set(id, e.target.value)}
            required={required}
            placeholder={placeholder}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-y"
          />
        ) : (
          <input
            type={type}
            value={form[id] || ''}
            onChange={e => set(id, e.target.value)}
            required={required}
            placeholder={placeholder}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        )}
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
    );
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-white bg-green-700 px-4 py-2 rounded-t-lg">{title}</h3>
      <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API}/api/equipment/public-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Submission failed');
      const data = await res.json();
      setSubmittedId(data.id);
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Submission Received!</h2>
          <p className="text-gray-500 text-sm mb-4">Your asset data has been submitted successfully. Our team will review it shortly.</p>
          <div className="bg-gray-50 rounded-lg px-4 py-2 text-xs text-gray-500 font-mono mb-6">{submittedId}</div>
          <button onClick={() => { setSubmitted(false); setForm({}); setStep(1); }}
            className="bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-800">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  const catKeys = Object.keys(CATEGORIES);
  const subCats = CATEGORIES[form.category as string] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">E</div>
            <div>
              <div className="font-bold text-sm text-gray-900">ERMA Supplier Portal</div>
              <div className="text-xs text-gray-400">Asset Data Submission</div>
            </div>
          </div>
          <a href="/login" className="text-sm text-green-700 hover:underline">Staff Login</a>
        </div>
        {/* Step indicators */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="flex gap-2">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setStep(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${step === s.id ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {s.id}. {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Step 1: Supplier & Specs */}
        {step === 1 && (
          <>
            <Section title="Supplier & Product Identity">
              <Field label="Supplier Company Name" id="supplierName" required placeholder="e.g. Daikin Thailand Co., Ltd." />
              <Field label="Tax ID" id="taxId" placeholder="13-digit tax number" />
              <Field label="Contact Email" id="supplierEmail" type="email" required placeholder="contact@company.co.th" />
              <Field label="Contact Phone" id="supplierPhone" placeholder="02-xxx-xxxx" />
              <Field label="Category" id="category" type="select" required options={catKeys} />
              {subCats.length > 0 && <Field label="Sub Category" id="subCategory" type="select" options={subCats} />}
              <Field label="Contract / PO No." id="poNo" placeholder="PO-2026-XXXXX" />
              <Field label="Brand / Manufacturer" id="brand" required placeholder="e.g. Daikin, Samsung" />
              <Field label="Country of Origin" id="countryOfOrigin" placeholder="e.g. Japan, Thailand" />
              <Field label="Product Series" id="productSeries" placeholder="e.g. Inverter FTV Series" />
              <Field label="Model No." id="model" required placeholder="e.g. FTV50QV1V" />
              <Field label="Serial No." id="serialNo" placeholder="From nameplate" />
              <Field label="MFG Date" id="mfgDate" type="month" />
            </Section>
            <Section title="Technical Specification">
              <Field label="Asset Name (EN)" id="nameEn" required placeholder="e.g. Air-cooled Chiller Unit A" />
              <Field label="Asset Name (TH)" id="nameTh" placeholder="ชื่อสินทรัพย์ภาษาไทย" />
              <Field label="Capacity / Rating" id="capacity" required placeholder="e.g. 18000 BTU, 2.5 kW" />
              <Field label="Power Requirement" id="powerRequirement" required placeholder="e.g. 380V 3P 50Hz / 2.5 kW" />
              <Field label="Utility Requirement" id="utilityRequirement" placeholder="Water / Air / Steam per hour" />
              <Field label="Dimension & Weight" id="dimensions" required placeholder="W×L×H (mm) + kg" />
              <Field label="Operating Condition" id="operatingCondition" placeholder="Temp / Humidity / Environment" />
              <Field label="Standards & Certificates" id="standards" required placeholder="e.g. มอก. / CE / UL / ISO + cert no." />
              <div className="sm:col-span-2">
                <Field label="Functional Requirements" id="functionalReqs" type="textarea"
                  placeholder="Key features, controls, operating modes…" />
              </div>
            </Section>
          </>
        )}

        {/* Step 2: Warranty & Spare Parts */}
        {step === 2 && (
          <>
            <Section title="Warranty & Service Level">
              <Field label="Warranty Start Date" id="warrantyStart" type="date" required />
              <Field label="Warranty End Date" id="warrantyEnd" type="date" required />
              <Field label="Warranty Scope" id="warrantyScope" type="select" required
                options={['Parts + Labour', 'Parts only', 'On-site', 'Return-to-base']} />
              <Field label="Extended Warranty Option (THB/yr)" id="extendedWarrantyOption"
                placeholder="e.g. 12,000 / yr" />
              <div className="sm:col-span-2">
                <Field label="Warranty Condition & Exclusion" id="warrantyCondition" type="textarea" required
                  placeholder="Conditions that void warranty…" />
              </div>
              <Field label="SLA Response Time (hours)" id="slaResponseHr" type="number" required
                placeholder="e.g. 4" />
              <Field label="SLA Restore Time (hours)" id="slaRestoreHr" type="number" required
                placeholder="e.g. 24" />
              <div className="sm:col-span-2">
                <Field label="Service Center & Contact" id="serviceCenter" required
                  placeholder="Service center name / tel / email (24hr)" />
              </div>
              <div className="sm:col-span-2">
                <Field label="Training & Commissioning" id="training"
                  placeholder="Training hours / hand-over documents" />
              </div>
            </Section>
            <Section title="Spare Parts">
              <Field label="Part No." id="spPartNo" required placeholder="Manufacturer part number / SKU" />
              <Field label="Part Name" id="spPartName" required placeholder="e.g. Ball Bearing 6205" />
              <Field label="Part Classification" id="spClassification" type="select" required
                options={['Critical', 'Wear Part', 'Consumable']} />
              <Field label="Currency" id="spCurrency" type="select" options={['THB', 'USD', 'JPY', 'EUR']} />
              <Field label="Unit Price" id="spUnitPrice" type="number" placeholder="Price per unit" />
              <Field label="Replacement Interval" id="replacementInterval" placeholder="e.g. 8,000 hrs / 6 months" />
              <Field label="Lead Time (days)" id="spLeadTimeDays" type="number" required
                placeholder="Days from order to delivery" />
              <Field label="Min. Stock Recommend" id="minStockRecommend" type="number"
                placeholder="Qty to keep on hand" />
              <Field label="Part Availability Guarantee (years)" id="partAvailabilityYr" type="number" required
                placeholder="Years manufacturer guarantees parts supply" />
            </Section>
          </>
        )}

        {/* Step 3: Lifecycle & TCO */}
        {step === 3 && (
          <>
            <Section title="Useful Life & Lifecycle">
              <Field label="Useful Life (years)" id="usefulLifeYr" type="number" required placeholder="Manufacturer recommended" />
              <Field label="Operating Hours / Year" id="hoursPerYear" type="number" required placeholder="e.g. 8760" />
              <Field label="Design Life / Duty Cycle" id="designLife" placeholder="Total hours + cycles per day" />
              <Field label="Economic Life (years)" id="economicLifeYr" type="number" placeholder="Break-even lifetime" />
              <Field label="Major Overhaul Year" id="overhaul" placeholder="Year + estimated cost (THB)" />
              <Field label="Expected Residual Value (%)" id="residualValuePct" type="number" placeholder="% of purchase price" />
              <Field label="End-of-Support Year" id="endOfSupportYr" type="number" required placeholder="Year manufacturer stops supporting" />
              <div className="sm:col-span-2">
                <Field label="Disposal / Recycle Guide" id="disposalGuide" type="textarea"
                  placeholder="Hazardous materials, recycling process…" />
              </div>
            </Section>
            <Section title="Maintenance Budget Forecast">
              <Field label="Purchase Price (THB)" id="purchasePrice" type="number" required placeholder="0" />
              <Field label="Year 1-N Maintenance Cost (THB/yr)" id="maintCostPerYear" type="number" required placeholder="Annual estimate" />
              <Field label="PM Package Price" id="pmPackagePrice" placeholder="e.g. 2,500 / visit × 4 visits/yr" />
              <Field label="Consumable Cost / Year (THB)" id="consumableCostPerYear" type="number" placeholder="Filters, oil, chemicals…" />
              <Field label="Labor Rate (THB/hr)" id="laborRate" type="number" placeholder="Out-of-warranty rate" />
              <Field label="Energy Consumption (kWh/hr)" id="energyKwhPerHr" type="number" placeholder="For energy cost calculation" />
              <Field label="Price Escalation Assumption (%/yr)" id="priceEscalationPct" type="number" placeholder="e.g. 3" />
            </Section>
            <Section title="Carbon Footprint (Optional)">
              <Field label="Emission Factor (kgCO₂e/kWh)" id="emissionFactor" type="number" placeholder="0.4999" />
              <Field label="Carbon Credit Price (THB/tCO₂e)" id="carbonCreditPrice" type="number" placeholder="e.g. 200" />
            </Section>
          </>
        )}

        {/* Navigation */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            ← Previous
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(s => Math.min(3, s + 1))}
              className="px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 disabled:bg-green-400"
            >
              {loading ? 'Submitting…' : 'Submit Asset Data'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

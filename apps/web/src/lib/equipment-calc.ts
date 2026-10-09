export function calcTco(d: any): number | null {
  const price = Number(d.purchasePrice || 0);
  const maint = Number(d.maintCostPerYear || 0);
  const cons = Number(d.consumableCostPerYear || 0);
  const energy = Number(d.energyKwhPerHr || 0);
  const hrs = Number(d.hoursPerYear || 8760);
  const life = Number(d.usefulLifeYr || 0);
  const esc = Number(d.priceEscalationPct || 0) / 100;
  const resid = (Number(d.residualValuePct || 0) / 100) * price;
  if (!life) return null;
  const energyCostPerYear = energy * hrs * 4;
  const opex = (maint + cons + energyCostPerYear) * life * (1 + esc * life / 2);
  return Math.round(price + opex - resid);
}

export function calcCarbon(d: any) {
  const energy = Number(d.energyKwhPerHr || 0);
  const hrs = Number(d.hoursPerYear || 8760);
  const life = Number(d.usefulLifeYr || 0);
  const ef = Number(d.emissionFactor || 0.4999);
  const cprice = Number(d.carbonCreditPrice || 0);
  if (!energy || !life) return null;
  const co2PerYear = (energy * hrs * ef) / 1000;
  const co2Lifetime = co2PerYear * life;
  const carbonCreditValue = co2Lifetime * cprice;
  return { co2PerYear, co2Lifetime, carbonCreditValue };
}

const ALLOWED_UPDATE_FIELDS = [
  'nameEn', 'nameTh', 'category', 'subCategory', 'brand', 'model', 'serialNo',
  'tagNumber', 'assetCode', 'mtnCode', 'shortSpec', 'fullSpec',
  'company', 'businessUnit', 'branchSiteCode', 'responsiblePerson',
  'costCenter', 'glAccount', 'subAccount', 'wbs', 'contractNo', 'poNo',
  'installDate', 'status', 'criticality', 'warrantyMonths', 'warrantyEndDate',
  'usefulLifeYr', 'economicLifeYr', 'designLife', 'overhaul', 'residualValuePct',
  'endOfSupportYr', 'disposalGuide', 'hoursPerYear',
  'purchasePrice', 'maintCostPerYear', 'pmPackagePrice', 'consumableCostPerYear',
  'laborRate', 'energyKwhPerHr', 'priceEscalationPct',
  'emissionFactor', 'carbonCreditPrice',
  'assetTypeId', 'serviceTypeId', 'locationId', 'recordStatus', 'submissionStatus',
];

export function sanitizeUpdate(dto: any) {
  return Object.fromEntries(Object.entries(dto).filter(([k]) => ALLOWED_UPDATE_FIELDS.includes(k)));
}

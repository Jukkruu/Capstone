import { PrismaClient, BigcRole, SupplierStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // BigC internal users
  const admin = await prisma.bigcUser.upsert({
    where: { email: 'admin@bigc.co.th' },
    update: {},
    create: {
      email: 'admin@bigc.co.th',
      displayName: 'System Admin',
      passwordHash: hash('Admin1234!'),
      role: BigcRole.ADMIN,
      employeeNo: 'EMP-0001',
      department: 'Digital Technology Group',
    },
  });

  await prisma.bigcUser.upsert({
    where: { email: 'editor@bigc.co.th' },
    update: {},
    create: {
      email: 'editor@bigc.co.th',
      displayName: 'BigC Editor',
      passwordHash: hash('Editor1234!'),
      role: BigcRole.EDITOR,
      employeeNo: 'EMP-0002',
      department: 'Procurement',
    },
  });

  await prisma.bigcUser.upsert({
    where: { email: 'gcp@bigc.co.th' },
    update: {},
    create: {
      email: 'gcp@bigc.co.th',
      displayName: 'GCP Buyer',
      passwordHash: hash('Gcp1234!'),
      role: BigcRole.GCP,
      employeeNo: 'EMP-0003',
      department: 'Group Central Purchasing',
    },
  });

  await prisma.bigcUser.upsert({
    where: { email: 'user@bigc.co.th' },
    update: {},
    create: {
      email: 'user@bigc.co.th',
      displayName: 'Maintenance User',
      passwordHash: hash('User1234!'),
      role: BigcRole.USER,
      employeeNo: 'EMP-0004',
      department: 'Maintenance - Refrigeration',
    },
  });

  // CMS asset type masters (mock)
  const assetTypes = [
    { id: 'AT-001', name: 'Chiller' },
    { id: 'AT-002', name: 'Cooling Tower' },
    { id: 'AT-003', name: 'Air Conditioner / AHU' },
    { id: 'AT-004', name: 'Refrigeration System' },
    { id: 'AT-005', name: 'Electrical System' },
    { id: 'AT-006', name: 'Safety Equipment' },
    { id: 'AT-007', name: 'Logistic Equipment' },
    { id: 'AT-008', name: 'Super Equipment' },
    { id: 'AT-009', name: 'Waste Water System' },
    { id: 'AT-010', name: 'LED Signage' },
    { id: 'AT-011', name: 'General Home Use Equipment' },
    { id: 'AT-012', name: 'Shopping Trolley' },
    { id: 'AT-013', name: 'Fork Lift' },
    { id: 'AT-014', name: 'Small Equipment' },
  ];

  for (const at of assetTypes) {
    await prisma.assetTypeMaster.upsert({
      where: { id: at.id },
      update: {},
      create: at,
    });
  }

  // CMS service type masters (mock)
  const serviceTypes = [
    { id: 'ST-001', name: 'PM - Cooling' },
    { id: 'ST-002', name: 'PM - Electrical' },
    { id: 'ST-003', name: 'PM - Mechanical' },
    { id: 'ST-004', name: 'Corrective Maintenance' },
    { id: 'ST-005', name: 'Inspection' },
    { id: 'ST-006', name: 'Calibration' },
  ];

  for (const st of serviceTypes) {
    await prisma.serviceTypeMaster.upsert({
      where: { id: st.id },
      update: {},
      create: st,
    });
  }

  // Demo location
  await prisma.location.upsert({
    where: { storeCode: 'BKK-001' },
    update: {},
    create: {
      storeCode: 'BKK-001',
      buildingZone: 'Rama 9 - B1',
      company: 'Big C Supercenter PCL',
      businessUnit: 'Retail',
      branch: 'BKK-001 (Rama 9)',
    },
  });

  // Demo vendor supplier
  await prisma.supplier.upsert({
    where: { contactEmail: 'supplier@demo.co.th' },
    update: {},
    create: {
      name: 'Demo Supply Co., Ltd.',
      contactEmail: 'supplier@demo.co.th',
      contactPhone: '02-123-4567',
      taxId: '0105558012345',
      passwordHash: hash('Supplier1234!'),
      mustChangePassword: false,
      accountStatus: SupplierStatus.ACTIVE,
      registeredById: admin.id,
    },
  });

  console.log('Seed completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

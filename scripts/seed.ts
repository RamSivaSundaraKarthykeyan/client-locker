import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Load .env.local if present and not already in environment
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to run the seed script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function runSeed() {
  console.log('--- Starting Seed Script ---');

  // 1. Create Firm
  console.log('1. Creating Firm...');
  const { data: firm, error: firmError } = await supabase
    .from('firms')
    .insert({ name: 'Apex Accounting & Advisory LLP' })
    .select()
    .single();

  if (firmError) throw firmError;
  const firmId = firm.id;
  console.log(`Created firm: ${firm.name} (${firmId})`);

  // Default test password for all test accounts
  const commonPasswordHash = await bcrypt.hash('Password123!', 10);

  // 2. Create 2 Partners
  console.log('2. Creating 2 Partners...');
  const partnersData = [
    {
      firm_id: firmId,
      email: 'partner.elena@apexadvisory.com',
      password_hash: commonPasswordHash,
      full_name: 'Elena Rostova',
      role: 'partner',
      title: 'Managing Partner',
    },
    {
      firm_id: firmId,
      email: 'partner.marcus@apexadvisory.com',
      password_hash: commonPasswordHash,
      full_name: 'Marcus Vance',
      role: 'partner',
      title: 'Tax & Compliance Partner',
    },
  ];

  const { data: partners, error: partnersError } = await supabase
    .from('people')
    .insert(partnersData)
    .select();
  if (partnersError) throw partnersError;
  console.log(`Created ${partners.length} partners.`);

  // 3. Create 6 Staff (one is a trainee)
  console.log('3. Creating 6 Staff (including 1 trainee)...');
  const staffData = [
    {
      firm_id: firmId,
      email: 'staff.sarah@apexadvisory.com',
      password_hash: commonPasswordHash,
      full_name: 'Sarah Jenkins',
      role: 'staff',
      title: 'Senior Audit Associate',
    },
    {
      firm_id: firmId,
      email: 'staff.david@apexadvisory.com',
      password_hash: commonPasswordHash,
      full_name: 'David Kim',
      role: 'staff',
      title: 'Tax Specialist',
    },
    {
      firm_id: firmId,
      email: 'staff.priya@apexadvisory.com',
      password_hash: commonPasswordHash,
      full_name: 'Priya Sharma',
      role: 'staff',
      title: 'Client Accounts Manager',
    },
    {
      firm_id: firmId,
      email: 'staff.alex@apexadvisory.com',
      password_hash: commonPasswordHash,
      full_name: 'Alex Rivera',
      role: 'staff',
      title: 'Senior Forensic Analyst',
    },
    {
      firm_id: firmId,
      email: 'staff.chloe@apexadvisory.com',
      password_hash: commonPasswordHash,
      full_name: 'Chloe Bennett',
      role: 'staff',
      title: 'Junior Auditor',
    },
    {
      firm_id: firmId,
      email: 'staff.leo@apexadvisory.com',
      password_hash: commonPasswordHash,
      full_name: 'Leo Martin (Trainee)',
      role: 'staff',
      title: 'Trainee',
    },
  ];

  const { data: staffList, error: staffError } = await supabase
    .from('people')
    .insert(staffData)
    .select();
  if (staffError) throw staffError;
  console.log(`Created ${staffList.length} staff members.`);

  // 4. Create 10 Clients (Entities + Primary contact person for each)
  console.log('4. Creating 10 Clients and their login accounts...');
  const clientsDefinitions = [
    { company: 'NovaTech Dynamics', industry: 'Enterprise SaaS', contactName: 'Rachel Green', email: 'client.novatech@clientlocker.test' },
    { company: 'BlueWave Logistics Ltd', industry: 'Supply Chain', contactName: 'Liam Carter', email: 'client.bluewave@clientlocker.test' },
    { company: 'Crestview Healthcare', industry: 'Health & Medical', contactName: 'Dr. Evelyn Moore', email: 'client.crestview@clientlocker.test' },
    { company: 'Summit Peak Capital', industry: 'Venture Capital', contactName: 'Arthur Hastings', email: 'client.summit@clientlocker.test' },
    { company: 'GreenLeaf Organics', industry: 'Agriculture & Retail', contactName: 'Maya Lin', email: 'client.greenleaf@clientlocker.test' },
    { company: 'Solstice Solar Energy', industry: 'Clean Tech', contactName: 'Julian Vance', email: 'client.solstice@clientlocker.test' },
    { company: 'Quantum Robotics Inc', industry: 'Deep Tech', contactName: 'Dr. Kenji Sato', email: 'client.quantum@clientlocker.test' },
    { company: 'Harborstone Real Estate', industry: 'Property & Development', contactName: 'Victoria Thorne', email: 'client.harborstone@clientlocker.test' },
    { company: 'Silverline Media Group', industry: 'Broadcasting & Creative', contactName: 'Oscar Diaz', email: 'client.silverline@clientlocker.test' },
    { company: 'Vanguard Cyber Security', industry: 'Information Security', contactName: 'Nadia Petrov', email: 'client.vanguard@clientlocker.test' },
  ];

  const primaryStaff = staffList[0]; // Sarah Jenkins
  const createdClients = [];

  for (const item of clientsDefinitions) {
    // A. Create the client person
    const { data: clientPerson, error: personErr } = await supabase
      .from('people')
      .insert({
        firm_id: firmId,
        email: item.email,
        password_hash: commonPasswordHash,
        full_name: item.contactName,
        role: 'client',
        title: 'Authorized Representative',
      })
      .select()
      .single();
    if (personErr) throw personErr;

    // B. Create client entity
    const { data: clientEntity, error: clientErr } = await supabase
      .from('clients')
      .insert({
        firm_id: firmId,
        name: item.company,
        industry: item.industry,
        primary_contact_person_id: clientPerson.id,
      })
      .select()
      .single();
    if (clientErr) throw clientErr;

    createdClients.push(clientEntity);

    // C. Grant client access to staff members
    await supabase.from('client_access').insert([
      { client_id: clientEntity.id, person_id: primaryStaff.id },
      { client_id: clientEntity.id, person_id: clientPerson.id },
    ]);

    // D. Add 5 Checklist Items for this client
    const checklist = [
      { client_id: clientEntity.id, title: 'Upload Signed Engagement Letter 2026', status: 'completed' },
      { client_id: clientEntity.id, title: 'Provide Q3 Trial Balance & General Ledger', status: 'pending' },
      { client_id: clientEntity.id, title: 'Bank Reconciliation Statements (Jan - Oct)', status: 'in_review' },
      { client_id: clientEntity.id, title: 'Certificate of Incorporation & Shareholder Register', status: 'completed' },
      { client_id: clientEntity.id, title: 'Director Identification Documents (KYC/AML)', status: 'pending' },
    ];
    await supabase.from('checklist_items').insert(checklist);
  }
  console.log(`Created ${createdClients.length} clients with 5 checklist items each.`);

  // 5. Upload sample private file to private storage bucket 'client-vault'
  console.log('5. Ensuring private bucket and uploading sample PDF...');
  const samplePdfBytes = Buffer.from(
    `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF`
  );

  const sampleClientId = createdClients[0].id;
  const storageFilePath = `${sampleClientId}/sample_engagement_letter.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('client-vault')
    .upload(storageFilePath, samplePdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.warn('Note: Could not upload sample file to bucket directly (verify bucket "client-vault" exists in Supabase):', uploadError.message);
  } else {
    console.log('Uploaded sample PDF to private bucket "client-vault".');
    await supabase.from('files').insert({
      client_id: sampleClientId,
      uploaded_by_person_id: primaryStaff.id,
      file_name: 'sample_engagement_letter.pdf',
      file_size_bytes: samplePdfBytes.length,
      mime_type: 'application/pdf',
      storage_path: storageFilePath,
    });
    console.log('Recorded sample file in "files" table.');
  }

  console.log('--- Seed Completed Successfully! ---');
  console.log('Test Accounts (Password for all: Password123!):');
  console.log(' - Partner: partner.elena@apexadvisory.com');
  console.log(' - Staff:   staff.sarah@apexadvisory.com');
  console.log(' - Client:  client.novatech@clientlocker.test');
}

runSeed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});


import 'dotenv/config';
import { WorkTimeModelType, SuratType, ApprovalType, PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding Location data...');
    const hq = await prisma.location.upsert({
        where: { id: 'hq-location' }, // Use a fixed ID for seeding
        update: {
            name: 'Headquarters (HQ)',
            address: 'Jl. Jend. Sudirman No. 1, Jakarta',
            city: 'Jakarta',
            isActive: true,
        },
        create: {
            id: 'hq-location',
            name: 'Headquarters (HQ)',
            address: 'Jl. Jend. Sudirman No. 1, Jakarta',
            city: 'Jakarta',
            isActive: true,
        }
    });
    
    const branch = await prisma.location.upsert({
        where: { id: 'branch-surabaya' },
        update: {
            name: 'Branch Office - Surabaya',
            address: 'Jl. Raya Darmo, Surabaya',
            city: 'Surabaya',
            isActive: true,
        },
        create: {
            id: 'branch-surabaya',
            name: 'Branch Office - Surabaya',
            address: 'Jl. Raya Darmo, Surabaya',
            city: 'Surabaya',
            isActive: true,
        }
    });

    console.log('🌱 Seeding WorkTimeModels data...');
    const regular = await prisma.workTimeModel.upsert({
        where: { id: 'work-model-regular' },
        update: {
            name: 'Regular Office Hours (09:00 - 18:00)',
            type: WorkTimeModelType.REGULAR,
        },
        create: {
            id: 'work-model-regular',
            name: 'Regular Office Hours (09:00 - 18:00)',
            type: WorkTimeModelType.REGULAR,
            schedules: {
                create: [
                    { shiftName: 'Regular', startTime: '09:00', endTime: '18:00', breakMinutes: 60 }
                ]
            }
        }
    });
    
    const shift2 = await prisma.workTimeModel.upsert({
        where: { id: 'work-model-shift2' },
        update: {
            name: '2-Shift Operation',
            type: WorkTimeModelType.SHIFT_2,
        },
        create: {
            id: 'work-model-shift2',
            name: '2-Shift Operation',
            type: WorkTimeModelType.SHIFT_2,
            schedules: {
                create: [
                    { shiftName: 'Shift 1 (Pagi)', startTime: '07:00', endTime: '15:00', breakMinutes: 60 },
                    { shiftName: 'Shift 2 (Sore)', startTime: '15:00', endTime: '23:00', breakMinutes: 60 }
                ]
            }
        }
    });

    // ... (SuratTemplate logic is already using upsert)
    console.log('🌱 Seeding Surat Templates...');
    const suratTypes = [
        { type: SuratType.SP1, name: 'Surat Peringatan 1 (SP1)', defaultFormat: '{{seq}}/{{month}}/SP1/HR/{{year}}' },
        { type: SuratType.SP2, name: 'Surat Peringatan 2 (SP2)', defaultFormat: '{{seq}}/{{month}}/SP2/HR/{{year}}' },
        { type: SuratType.SP3, name: 'Surat Peringatan 3 (SP3)', defaultFormat: '{{seq}}/{{month}}/SP3/HR/{{year}}' },
        { type: SuratType.PENGANGKATAN_TETAP, name: 'Surat Pengangkatan Karyawan Tetap', defaultFormat: '{{seq}}/{{month}}/SK-TETAP/HR/{{year}}' },
        { type: SuratType.PROMOSI, name: 'Surat Promosi', defaultFormat: '{{seq}}/{{month}}/PROMOSI/HR/{{year}}' },
        { type: SuratType.DEMOSI, name: 'Surat Demosi', defaultFormat: '{{seq}}/{{month}}/DEMOSI/HR/{{year}}' },
        { type: SuratType.MUTASI, name: 'Surat Mutasi', defaultFormat: '{{seq}}/{{month}}/MUTASI/HR/{{year}}' },
        { type: SuratType.PEMBERHENTIAN, name: 'Surat Pemberhentian Karyawan', defaultFormat: '{{seq}}/{{month}}/PHK/HR/{{year}}' },
        { type: SuratType.PENGUNDURAN_DIRI, name: 'Surat Pengunduran Diri (Template)', defaultFormat: '{{seq}}/{{month}}/RESIGN/HR/{{year}}' },
        { type: SuratType.PURCHASE_REQUEST, name: 'Purchase Request', defaultFormat: '{{seq}}/{{month}}/PR/FIN/{{year}}' },
        { type: SuratType.TUGAS, name: 'Surat Tugas', defaultFormat: '{{seq}}/{{month}}/TUGAS/HR/{{year}}' },
        { type: SuratType.KETERANGAN_PENGHASILAN, name: 'Surat Keterangan Penghasilan', defaultFormat: '{{seq}}/{{month}}/SKP/HR/{{year}}' },
        { type: SuratType.PAKLARING, name: 'Surat Paklaring', defaultFormat: '{{seq}}/{{month}}/PAKLARING/HR/{{year}}' },
        { type: SuratType.KETERANGAN_KERJA, name: 'Surat Keterangan Kerja (Active)', defaultFormat: '{{seq}}/{{month}}/SKK/HR/{{year}}' },
    ];

    const sampleHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; color: #333;">
  <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px;">
    <h2>PT. INDOWEBHOST KREASI (HRIS DEMO)</h2>
    <p>Jl. Jend. Sudirman No. 1, Jakarta</p>
  </div>
  
  <div style="text-align: center; margin-bottom: 20px;">
    <h3 style="text-transform: uppercase;">{{surat_title}}</h3>
    <p>No: {{surat_number}}</p>
  </div>

  <p>Yang bertanda tangan di bawah ini:</p>
  <table style="width: 100%; margin-bottom: 20px;">
    <tr><td style="width: 200px;">Nama</td><td>: {{hr_name}}</td></tr>
    <tr><td>Jabatan</td><td>: {{hr_position}}</td></tr>
  </table>

  <p>Dengan ini menerangkan bahwa:</p>
  <table style="width: 100%; margin-bottom: 20px;">
    <tr><td style="width: 200px;">Nama</td><td>: <strong>{{employee_name}}</strong></td></tr>
    <tr><td>NIK</td><td>: {{employee_number}}</td></tr>
    <tr><td>Jabatan</td><td>: {{position}}</td></tr>
    <tr><td>Departemen</td><td>: {{department}}</td></tr>
  </table>

  <p>
    Adalah benar karyawan aktif di PT Indowebhost Kreasi sejak {{hire_date}}. Maksud dan tujuan surat ini adalah {{reason}}.
  </p>
  
  <p style="margin-top: 40px;">Demikian surat ini dibuat agar dapat digunakan sebagaimana mestinya.</p>
  
  <div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div style="width: 200px; text-align: center;">
      <p>Dikeluarkan di: Jakarta</p>
      <p>Pada tanggal: {{issued_date}}</p>
      <br><br><br><br>
      <p><strong>{{hr_name}}</strong></p>
      <p style="border-top: 1px solid #333;">{{hr_position}}</p>
    </div>
  </div>
</div>
`;

    for (const st of suratTypes) {
        await prisma.suratTemplate.upsert({
            where: { type: st.type },
            update: { 
                name: st.name,
                htmlContent: sampleHtml.replace('{{surat_title}}', st.name),
                numberFormat: st.defaultFormat
            },
            create: {
                type: st.type,
                name: st.name,
                htmlContent: sampleHtml.replace('{{surat_title}}', st.name),
                numberFormat: st.defaultFormat
            }
        });
    }

    console.log('🌱 Seeding EmailConfig...');
    const existingEmail = await prisma.emailConfig.findFirst();
    if (!existingEmail) {
        await prisma.emailConfig.create({
            data: {
                smtpHost: 'smtp.gmail.com',
                smtpPort: 465,
                smtpUser: 'hris@example.com',
                smtpPass: 'password_placeholder',
                fromName: 'HRIS System',
                fromEmail: 'hris@example.com',
                isActive: true,
            }
        });
    }

    console.log('✅ All features seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

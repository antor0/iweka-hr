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

    console.log('🌱 Seeding Surat Templates...');

    const baseCss = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  
  .surat-container {
    font-family: 'Inter', 'Arial', sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    color: #1a1a1a;
    background: white;
  }

  .header {
    text-align: center;
    border-bottom: 3px double #1a1a1a;
    margin-bottom: 40px;
    padding-bottom: 20px;
  }

  .header h2 {
    margin: 0;
    font-size: 24px;
    letter-spacing: 1px;
    color: #000;
  }

  .header p {
    margin: 5px 0 0;
    font-size: 14px;
    color: #666;
  }

  .title-block {
    text-align: center;
    margin-bottom: 40px;
  }

  .title-block h3 {
    text-decoration: underline;
    text-transform: uppercase;
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  .title-block p {
    margin: 5px 0 0;
    font-size: 14px;
    font-weight: 600;
  }

  .content-section {
    margin-bottom: 25px;
    font-size: 15px;
  }

  .info-table {
    width: 100%;
    margin: 20px 0;
    border-collapse: collapse;
  }

  .info-table td {
    padding: 4px 0;
    vertical-align: top;
  }

  .info-table td:first-child {
    width: 180px;
  }

  .info-table td:nth-child(2) {
    width: 20px;
  }

  .signature-section {
    margin-top: 60px;
    display: flex;
    justify-content: space-between;
  }

  .signature-box {
    width: 200px;
    text-align: center;
  }

  .signature-space {
    height: 80px;
  }

  .signature-name {
    font-weight: 700;
    text-decoration: underline;
  }

  .signature-title {
    font-size: 13px;
    color: #444;
  }

  .footer-note {
    margin-top: 50px;
    font-style: italic;
    font-size: 12px;
    color: #777;
    text-align: center;
  }

  @media print {
    body { background: white; }
    .surat-container { padding: 0; width: 100%; border: none; }
  }
</style>
`;

    const getLayout = (title: string, body: string, footerNote: string = "Dibuat secara otomatis oleh Sistem HRIS") => `
<div class="surat-container">
  ${baseCss}
  <div class="header">
    <h2>PT. INDOWEBHOST KREASI</h2>
    <p>Gedung Cyber 1, Lt. 5, Jl. Kuningan Barat No. 8, Jakarta Selatan 12710</p>
    <p>Telp: (021) 1234-5678 | Email: hr@indowebhost.co.id</p>
  </div>

  <div class="title-block">
    <h3>${title}</h3>
    <p>Nomor: {{surat_number}}</p>
  </div>

  <div class="content-section">
    ${body}
  </div>

  <div class="signature-section">
    <div class="signature-box text-left">
      <p>Jakarta, {{issued_date}}</p>
      <p>Hormat Kami,</p>
      <div class="signature-space"></div>
      <p class="signature-name">{{hr_name}}</p>
      <p class="signature-title">{{hr_position}}</p>
    </div>
    
    <div class="signature-box">
      <p>&nbsp;</p>
      <p>Penerima,</p>
      <div class="signature-space"></div>
      <p class="signature-name">{{employee_name}}</p>
      <p class="signature-title">{{position}}</p>
    </div>
  </div>

  <div class="footer-note">
    ${footerNote}
  </div>
</div>
`;

    const templates: Record<string, string> = {
        [SuratType.SP1]: getLayout("Surat Peringatan Pertama (SP-1)", `
            <p>Surat Peringatan ini diberikan kepada:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
                <tr><td>Jabatan</td><td>:</td><td>{{position}}</td></tr>
                <tr><td>Departemen</td><td>:</td><td>{{department}}</td></tr>
            </table>
            <p>Sehubungan dengan pelanggaran disiplin yang telah Saudara lakukan, yaitu:</p>
            <p style="padding-left: 20px; font-weight: 600;"><em>"{{reason}}"</em></p>
            <p>Maka dengan ini Perusahaan memberikan <strong>Surat Peringatan Pertama (SP-1)</strong>. Kami mengharapkan agar Saudara dapat melakukan perbaikan kinerja dan tidak mengulangi kesalahan tersebut di masa mendatang.</p>
            <p>Surat Peringatan ini berlaku untuk jangka waktu 6 (enam) bulan terhitung sejak tanggal diterbitkan.</p>
        `),
        [SuratType.SP2]: getLayout("Surat Peringatan Kedua (SP-2)", `
            <p>Surat Peringatan ini diberikan kepada:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
                <tr><td>Jabatan</td><td>:</td><td>{{position}}</td></tr>
                <tr><td>Departemen</td><td>:</td><td>{{department}}</td></tr>
            </table>
            <p>Berdasarkan evaluasi terhadap kinerja dan kedisiplinan Saudara setelah diterbitkannya SP-1, ditemukan bahwa Saudara masih melakukan pelanggaran berupa:</p>
            <p style="padding-left: 20px; font-weight: 600;"><em>"{{reason}}"</em></p>
            <p>Oleh karena itu, Perusahaan memutuskan untuk menerbitkan <strong>Surat Peringatan Kedua (SP-2)</strong>. Apabila Saudara kembali melakukan pelanggaran selama masa berlakunya surat ini, maka Perusahaan akan mengambil langkah yang lebih tegas sesuai peraturan yang berlaku.</p>
        `),
        [SuratType.SP3]: getLayout("Surat Peringatan Ketiga (SP-3)", `
            <p>Surat Peringatan ini diberikan kepada:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
                <tr><td>Jabatan</td><td>:</td><td>{{position}}</td></tr>
                <tr><td>Departemen</td><td>:</td><td>{{department}}</td></tr>
            </table>
            <p>Ini adalah peringatan keras terakhir yang diberikan kepada Saudara sehubungan dengan:</p>
            <p style="padding-left: 20px; font-weight: 600;"><em>"{{reason}}"</em></p>
            <p>Dengan diterbitkannya <strong>Surat Peringatan Ketiga (SP-3)</strong> ini, Saudara berada dalam pengawasan ketat. Pelanggaran berikutnya dapat mengakibatkan pemutusan hubungan kerja (PHK) secara sepihak oleh Perusahaan.</p>
        `),
        [SuratType.PAKLARING]: getLayout("Surat Keterangan Pengalaman Kerja", `
            <p>Menerangkan dengan sebenarnya bahwa:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
                <tr><td>Jabatan Terakhir</td><td>:</td><td>{{position}}</td></tr>
                <tr><td>Departemen</td><td>:</td><td>{{department}}</td></tr>
            </table>
            <p>Pernah bekerja di PT. INDOWEBHOST KREASI sejak tanggal <strong>{{hire_date}}</strong> sampai dengan saat ini.</p>
            <p>Selama bekerja, yang bersangkutan telah menunjukkan dedikasi dan kinerja yang baik bagi Perusahaan. Kami mengucapkan terima kasih atas segala kontribusi yang telah diberikan dan berharap kesuksesan menyertai langkah Saudara di masa depan.</p>
        `, "Surat ini diterbitkan sebagai bukti pengalaman kerja resmi."),
        [SuratType.KETERANGAN_KERJA]: getLayout("Surat Keterangan Kerja", `
            <p>Pimpinan PT. INDOWEBHOST KREASI dengan ini menerangkan bahwa:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
                <tr><td>Jabatan</td><td>:</td><td>{{position}}</td></tr>
                <tr><td>Departemen</td><td>:</td><td>{{department}}</td></tr>
            </table>
            <p>Adalah benar merupakan karyawan aktif di Perusahaan kami, bergabung sejak tanggal <strong>{{hire_date}}</strong>. Yang bersangkutan memiliki catatan kinerja yang baik dan berkelakuan baik selama masa kerjanya.</p>
            <p>Surat keterangan ini diberikan untuk keperluan: <strong>{{reason}}</strong>.</p>
        `),
        [SuratType.PROMOSI]: getLayout("Surat Keputusan Promosi Jabatan", `
            <p>Direksi PT. INDOWEBHOST KREASI memutuskan untuk memberikan apresiasi atas kinerja luar biasa yang telah Saudara tunjukkan:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
            </table>
            <p>Berdasarkan hasil evaluasi tahunan, Saudara dinyatakan layak untuk mendapatkan promosi jabatan dengan detail sebagai berikut:</p>
            <p style="padding-left: 20px;"><strong>{{reason}}</strong></p>
            <p>Keputusan ini berlaku efektif sejak tanggal diterbitkannya surat ini. Kami berharap Saudara dapat menjalankan amanah baru ini dengan penuh tanggung jawab demi kemajuan bersama.</p>
        `),
        [SuratType.MUTASI]: getLayout("Surat Keputusan Mutasi Karyawan", `
            <p>Guna memenuhi kebutuhan organisasi dan optimalisasi sumber daya manusia, Manajemen memutuskan untuk melakukan mutasi terhadap:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
            </table>
            <p>Detail mutasi adalah sebagai berikut:</p>
            <p style="padding-left: 20px;"><strong>{{reason}}</strong></p>
            <p>Kami meyakini bahwa pengalaman dan keahlian Saudara akan memberikan kontribusi positif di unit kerja yang baru. Segala perlengkapan kerja harap segera dikoordinasikan dengan departemen terkait.</p>
        `),
        [SuratType.PENGANGKATAN_TETAP]: getLayout("Surat Keputusan Pengangkatan Karyawan Tetap", `
            <p>Berdasarkan hasil evaluasi selama masa percobaan (probation), Manajemen PT. INDOWEBHOST KREASI dengan bangga menyatakan bahwa:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
                <tr><td>Jabatan</td><td>:</td><td>{{position}}</td></tr>
            </table>
            <p>Terhitung sejak tanggal <strong>{{issued_date}}</strong>, Saudara resmi diangkat sebagai <strong>Karyawan Tetap</strong>.</p>
            <p>Segala hak dan kewajiban Saudara selanjutnya akan diatur sesuai dengan Peraturan Perusahaan yang berlaku. Selamat bergabung secara permanen dalam tim kami.</p>
        `),
        [SuratType.PEMBERHENTIAN]: getLayout("Surat Keputusan Pemutusan Hubungan Kerja", `
            <p>Manajemen PT. INDOWEBHOST KREASI dengan berat hati menyampaikan keputusan terkait status kepegawaian:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
            </table>
            <p>Sehubungan dengan <strong>{{reason}}</strong>, maka Perusahaan memutuskan untuk melakukan Pemutusan Hubungan Kerja (PHK) terhadap Saudara, efektif terhitung sejak tanggal surat ini.</p>
            <p>Segala hak-hak Saudara terkait pesangon dan administrasi lainnya akan diselesaikan sesuai dengan ketentuan perundang-undangan yang berlaku.</p>
        `),
        [SuratType.TUGAS]: getLayout("Surat Perintah Tugas (SPT)", `
            <p>Memberikan perintah kepada:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
                <tr><td>Jabatan</td><td>:</td><td>{{position}}</td></tr>
            </table>
            <p>Untuk melaksanakan tugas kedinasan sebagai berikut:</p>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #1a1a1a; margin: 15px 0;">
                {{reason}}
            </div>
            <p>Demikian surat tugas ini dibuat untuk dapat dilaksanakan dengan penuh tanggung jawab dan melaporkan hasilnya kepada atasan langsung.</p>
        `, "Surat Tugas ini berlaku selama periode penugasan berlangsung."),
    };

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

    for (const st of suratTypes) {
        const customHtml = templates[st.type] || getLayout(st.name, `
            <p>Sehubungan dengan keperluan operasional dan administrasi, Perusahaan memberikan surat ini kepada:</p>
            <table class="info-table">
                <tr><td>Nama</td><td>:</td><td><strong>{{employee_name}}</strong></td></tr>
                <tr><td>NIK</td><td>:</td><td>{{employee_number}}</td></tr>
            </table>
            <p>Detail keterangan: <strong>{{reason}}</strong></p>
            <p>Demikian surat ini disampaikan untuk dipergunakan sebagaimana mestinya.</p>
        `);

        await prisma.suratTemplate.upsert({
            where: { type: st.type },
            update: { 
                name: st.name,
                htmlContent: customHtml,
                numberFormat: st.defaultFormat
            },
            create: {
                type: st.type,
                name: st.name,
                htmlContent: customHtml,
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

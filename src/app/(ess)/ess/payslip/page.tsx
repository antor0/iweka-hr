"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

interface PayslipPeriod {
    payrollRunId: string;
    month: number;
    year: number;
    status: string;
    netSalary: number;
    finalizedAt?: string;
}

interface PayslipDetail {
    payrollRun: { periodMonth: number; periodYear: number; status: string; finalizedAt?: string };
    payrollItem: {
        basicSalary: number;
        totalAllowances: number;
        totalOvertime: number;
        grossIncome: number;
        pph21Amount: number;
        bpjsKesEmployee: number;
        bpjsTkJhtEmployee: number;
        bpjsTkJpEmployee: number;
        totalDeductions: number;
        netSalary: number;
        totalIncentives: number;
        employee: {
            fullName: string;
            employeeNumber: string;
            department?: { name: string };
            position?: { title: string };
            bankName?: string;
            bankAccount?: string;
        };
    };
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatIDR(num: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

export default function EssPayslipPage() {
    const router = useRouter();
    const [periods, setPeriods] = useState<PayslipPeriod[]>([]);
    const [selected, setSelected] = useState<PayslipPeriod | null>(null);
    const [detail, setDetail] = useState<PayslipDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const fetchPeriods = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/ess/payslip");
            if (res.status === 401) { router.push("/ess"); return; }
            if (res.ok) {
                const data = await res.json();
                setPeriods(data.data || []);
            }
        } catch { } finally { setIsLoading(false); }
    }, [router]);

    useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

    const fetchDetail = async (p: PayslipPeriod) => {
        setSelected(p);
        setDetail(null);
        setIsLoadingDetail(true);
        try {
            const res = await fetch(`/api/v1/ess/payslip?month=${p.month}&year=${p.year}`);
            if (res.ok) {
                const data = await res.json();
                setDetail(data.data);
            }
        } catch { } finally { setIsLoadingDetail(false); }
    };

    const handlePrint = () => {
        if (!detail) return;
        const emp = detail.payrollItem.employee;
        const item = detail.payrollItem;
        const run = detail.payrollRun;
        const periodLabel = `${MONTHS[run.periodMonth - 1]} ${run.periodYear}`;

        const printContent = `
            <html>
            <head>
                <title>Slip Gaji – ${periodLabel}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a2e; margin: 0; padding: 24px; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; }
                    .company { font-size: 20px; font-weight: 800; color: #6366f1; }
                    .slip-title { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 4px; }
                    .period { font-size: 12px; color: #64748b; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
                    .info-item label { font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
                    .info-item p { margin: 2px 0 0; font-weight: 600; font-size: 13px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                    th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
                    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
                    .amount { text-align: right; font-family: monospace; }
                    .total-row td { font-weight: 700; background: #f8fafc; }
                    .net-row td { font-weight: 800; font-size: 14px; background: #6366f1; color: #fff; }
                    .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="company">HRIS Pro</div>
                        <p style="margin:4px 0 0; color:#64748b; font-size:11px;">Human Resource Information System</p>
                    </div>
                    <div style="text-align:right">
                        <div class="slip-title">SLIP GAJI KARYAWAN</div>
                        <div class="period">Periode: ${periodLabel}</div>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-item"><label>Nama Karyawan</label><p>${emp.fullName}</p></div>
                    <div class="info-item"><label>Employee ID</label><p>${emp.employeeNumber}</p></div>
                    <div class="info-item"><label>Jabatan</label><p>${emp.position?.title || "—"}</p></div>
                    <div class="info-item"><label>Departemen</label><p>${emp.department?.name || "—"}</p></div>
                    <div class="info-item"><label>Bank</label><p>${emp.bankName || "—"}</p></div>
                    <div class="info-item"><label>No. Rekening</label><p>${emp.bankAccount ? "****" + emp.bankAccount.slice(-4) : "—"}</p></div>
                </div>

                <table>
                    <thead><tr><th>Komponen Penghasilan</th><th class="amount">Jumlah</th></tr></thead>
                    <tbody>
                        <tr><td>Gaji Pokok</td><td class="amount">${formatIDR(Number(item.basicSalary))}</td></tr>
                        <tr><td>Tunjangan</td><td class="amount">${formatIDR(Number(item.totalAllowances))}</td></tr>
                        <tr><td>Lembur</td><td class="amount">${formatIDR(Number(item.totalOvertime))}</td></tr>
                        ${Number(item.totalIncentives) > 0 ? `<tr><td>Insentif & Bonus</td><td class="amount">${formatIDR(Number(item.totalIncentives))}</td></tr>` : ""}
                        <tr class="total-row"><td>Total Penghasilan Bruto</td><td class="amount">${formatIDR(Number(item.grossIncome))}</td></tr>
                    </tbody>
                </table>

                <table>
                    <thead><tr><th>Potongan</th><th class="amount">Jumlah</th></tr></thead>
                    <tbody>
                        <tr><td>PPh 21</td><td class="amount">${formatIDR(Number(item.pph21Amount))}</td></tr>
                        <tr><td>BPJS Kesehatan (Karyawan)</td><td class="amount">${formatIDR(Number(item.bpjsKesEmployee))}</td></tr>
                        <tr><td>BPJS TK JHT (Karyawan)</td><td class="amount">${formatIDR(Number(item.bpjsTkJhtEmployee))}</td></tr>
                        <tr><td>BPJS TK JP (Karyawan)</td><td class="amount">${formatIDR(Number(item.bpjsTkJpEmployee))}</td></tr>
                        <tr class="total-row"><td>Total Potongan</td><td class="amount">${formatIDR(Number(item.totalDeductions))}</td></tr>
                    </tbody>
                </table>

                <table>
                    <tbody>
                        <tr class="net-row"><td>GAJI BERSIH (TAKE HOME PAY)</td><td class="amount">${formatIDR(Number(item.netSalary))}</td></tr>
                    </tbody>
                </table>

                <div class="footer">
                    Dokumen ini dibuat secara digital oleh sistem HRIS Pro. Tidak memerlukan tanda tangan fisik.<br>
                    Dicetak pada: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </div>
            </body>
            </html>
        `;

        const win = window.open("", "_blank");
        if (win) {
            win.document.write(printContent);
            win.document.close();
            win.focus();
            setTimeout(() => { win.print(); }, 500);
        }
    };

    if (isLoading) {
        return (
            <div style={s.root}>
                <div style={s.center}><div style={s.spinner} /></div>
            </div>
        );
    }

    return (
        <div style={s.root}>
            <OfflineBanner />
            <div style={s.orb} />

            <div style={s.page}>
                <h1 style={s.pageTitle}>Slip Gaji</h1>
                <p style={s.pageSub}>Pilih periode untuk melihat slip gaji</p>

                {periods.length === 0 ? (
                    <div style={s.emptyCard}>
                        <span style={{ fontSize: 48 }}>📭</span>
                        <p style={{ color: "#64748b", margin: "12px 0 0", textAlign: "center" as const }}>Belum ada slip gaji yang tersedia</p>
                    </div>
                ) : (
                    <>
                        {/* Period Selector */}
                        <div style={s.periodList}>
                            {periods.map((p) => (
                                <button
                                    key={`${p.year}-${p.month}`}
                                    id={`payslip-${p.year}-${p.month}`}
                                    onClick={() => fetchDetail(p)}
                                    style={{
                                        ...s.periodCard,
                                        border: selected?.month === p.month && selected?.year === p.year
                                            ? "1px solid rgba(99,102,241,0.5)"
                                            : "1px solid rgba(255,255,255,0.06)",
                                        background: selected?.month === p.month && selected?.year === p.year
                                            ? "rgba(99,102,241,0.12)"
                                            : "rgba(255,255,255,0.04)",
                                    }}
                                >
                                    <div style={s.periodIcon}>📄</div>
                                    <div style={s.periodInfo}>
                                        <p style={s.periodName}>{MONTHS[p.month - 1]} {p.year}</p>
                                        <p style={s.periodNet}>{formatIDR(Number(p.netSalary))}</p>
                                    </div>
                                    <span style={s.periodArrow}>›</span>
                                </button>
                            ))}
                        </div>

                        {/* Detail View */}
                        {selected && (
                            <div style={s.detailCard}>
                                {isLoadingDetail ? (
                                    <div style={s.detailLoading}><div style={s.spinner} /></div>
                                ) : detail ? (
                                    <>
                                        <div style={s.detailHeader}>
                                            <div>
                                                <p style={s.detailTitle}>Slip Gaji</p>
                                                <p style={s.detailPeriod}>{MONTHS[selected.month - 1]} {selected.year}</p>
                                            </div>
                                            <button
                                                id="download-payslip-btn"
                                                onClick={handlePrint}
                                                style={s.downloadBtn}
                                            >
                                                ⬇ Unduh PDF
                                            </button>
                                        </div>

                                        <div style={s.empInfo}>
                                            <p style={s.empName}>{detail.payrollItem.employee.fullName}</p>
                                            <p style={s.empRole}>{detail.payrollItem.employee.position?.title} · {detail.payrollItem.employee.department?.name}</p>
                                        </div>

                                        <div style={s.divider} />

                                        <p style={s.secLabel}>Penghasilan</p>
                                        {[
                                            { label: "Gaji Pokok", value: detail.payrollItem.basicSalary },
                                            { label: "Tunjangan", value: detail.payrollItem.totalAllowances },
                                            { label: "Lembur", value: detail.payrollItem.totalOvertime },
                                            ...(Number(detail.payrollItem.totalIncentives) > 0 ? [{ label: "Insentif & Bonus", value: detail.payrollItem.totalIncentives }] : []),
                                        ].map((row) => (
                                            <div key={row.label} style={s.row}>
                                                <span style={s.rowLabel}>{row.label}</span>
                                                <span style={s.rowValue}>{formatIDR(Number(row.value))}</span>
                                            </div>
                                        ))}
                                        <div style={{ ...s.row, ...s.totalRow }}>
                                            <span>Bruto</span>
                                            <span>{formatIDR(Number(detail.payrollItem.grossIncome))}</span>
                                        </div>

                                        <div style={s.divider} />

                                        <p style={s.secLabel}>Potongan</p>
                                        {[
                                            { label: "PPh 21", value: detail.payrollItem.pph21Amount },
                                            { label: "BPJS Kesehatan", value: detail.payrollItem.bpjsKesEmployee },
                                            { label: "BPJS JHT", value: detail.payrollItem.bpjsTkJhtEmployee },
                                            { label: "BPJS JP", value: detail.payrollItem.bpjsTkJpEmployee },
                                        ].map((row) => (
                                            <div key={row.label} style={s.row}>
                                                <span style={s.rowLabel}>{row.label}</span>
                                                <span style={{ ...s.rowValue, color: "#f87171" }}>–{formatIDR(Number(row.value))}</span>
                                            </div>
                                        ))}

                                        <div style={s.divider} />

                                        <div style={s.netRow}>
                                            <span style={s.netLabel}>Take Home Pay</span>
                                            <span style={s.netValue}>{formatIDR(Number(detail.payrollItem.netSalary))}</span>
                                        </div>
                                    </>
                                ) : (
                                    <p style={{ color: "#64748b", textAlign: "center" as const }}>Gagal memuat detail slip gaji</p>
                                )}
                            </div>
                        )}
                    </>
                )}

                <div style={{ height: 80 }} />
            </div>

            <EssNav />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } } button:hover:not(:disabled) { filter: brightness(1.1); }`}</style>
        </div>
    );
}

const s: Record<string, any> = {
    root: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1033 50%, #0a1628 100%)", fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)", position: "relative" },
    orb: { position: "fixed", top: "-10%", right: "-5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(99,102,241,0.15)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 },
    center: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
    spinner: { width: 36, height: 36, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    page: { position: "relative", zIndex: 1, padding: "20px 16px 0", maxWidth: 480, margin: "0 auto" },
    pageTitle: { margin: "0 0 2px", fontSize: 26, fontWeight: 800, color: "#e0e7ff" },
    pageSub: { margin: "0 0 20px", fontSize: 13, color: "#64748b" },
    emptyCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "40px 24px", display: "flex", flexDirection: "column", alignItems: "center" },
    periodList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 },
    periodCard: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", cursor: "pointer", transition: "all 0.2s", textAlign: "left" as const, width: "100%" },
    periodIcon: { fontSize: 24, flexShrink: 0 },
    periodInfo: { flex: 1 },
    periodName: { margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#e0e7ff" },
    periodNet: { margin: 0, fontSize: 12, color: "#64748b" },
    periodArrow: { fontSize: 20, color: "#475569" },
    detailCard: { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "20px 16px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" },
    detailLoading: { display: "flex", justifyContent: "center", padding: "24px 0" },
    detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
    detailTitle: { margin: "0 0 2px", fontSize: 16, fontWeight: 700, color: "#e0e7ff" },
    detailPeriod: { margin: 0, fontSize: 12, color: "#64748b" },
    downloadBtn: { padding: "8px 14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" },
    empInfo: { marginBottom: 12 },
    empName: { margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#e0e7ff" },
    empRole: { margin: 0, fontSize: 12, color: "#64748b" },
    divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" },
    secLabel: { margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.08em" },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", fontSize: 13 },
    rowLabel: { color: "#94a3b8" },
    rowValue: { color: "#cbd5e1", fontWeight: 500, fontFamily: "monospace" },
    totalRow: { fontWeight: 700, color: "#e0e7ff", fontSize: 13, borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 4, paddingTop: 8 },
    netRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", borderRadius: 12, padding: "14px 12px", marginTop: 4 },
    netLabel: { fontSize: 13, fontWeight: 700, color: "#a5b4fc" },
    netValue: { fontSize: 18, fontWeight: 800, color: "#e0e7ff", fontFamily: "monospace" },
};

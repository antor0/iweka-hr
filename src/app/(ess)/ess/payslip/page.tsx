"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    Download,
    Inbox,
    ChevronRight,
    ChevronDown,
    Banknote,
    Printer,
    FileCheck
} from "lucide-react";
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatIDR(num: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
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
                <title>Payslip – ${periodLabel}</title>
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
                        <div class="slip-title">EMPLOYEE PAYSLIP</div>
                        <div class="period">Period: ${periodLabel}</div>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-item"><label>Employee Name</label><p>${emp.fullName}</p></div>
                    <div class="info-item"><label>Employee ID</label><p>${emp.employeeNumber}</p></div>
                    <div class="info-item"><label>Position</label><p>${emp.position?.title || "—"}</p></div>
                    <div class="info-item"><label>Department</label><p>${emp.department?.name || "—"}</p></div>
                    <div class="info-item"><label>Bank</label><p>${emp.bankName || "—"}</p></div>
                    <div class="info-item"><label>Account Number</label><p>${emp.bankAccount ? "****" + emp.bankAccount.slice(-4) : "—"}</p></div>
                </div>

                <table>
                    <thead><tr><th>Earnings Component</th><th class="amount">Amount</th></tr></thead>
                    <tbody>
                        <tr><td>Basic Salary</td><td class="amount">${formatIDR(Number(item.basicSalary))}</td></tr>
                        <tr><td>Allowances</td><td class="amount">${formatIDR(Number(item.totalAllowances))}</td></tr>
                        <tr><td>Overtime</td><td class="amount">${formatIDR(Number(item.totalOvertime))}</td></tr>
                        ${Number(item.totalIncentives) > 0 ? `<tr><td>Incentives & Bonuses</td><td class="amount">${formatIDR(Number(item.totalIncentives))}</td></tr>` : ""}
                        <tr class="total-row"><td>Total Gross Earnings</td><td class="amount">${formatIDR(Number(item.grossIncome))}</td></tr>
                    </tbody>
                </table>

                <table>
                    <thead><tr><th>Deductions</th><th class="amount">Amount</th></tr></thead>
                    <tbody>
                        <tr><td>PPh 21 (Income Tax)</td><td class="amount">${formatIDR(Number(item.pph21Amount))}</td></tr>
                        <tr><td>BPJS Health (Employee)</td><td class="amount">${formatIDR(Number(item.bpjsKesEmployee))}</td></tr>
                        <tr><td>BPJS JHT (Employee)</td><td class="amount">${formatIDR(Number(item.bpjsTkJhtEmployee))}</td></tr>
                        <tr><td>BPJS JP (Employee)</td><td class="amount">${formatIDR(Number(item.bpjsTkJpEmployee))}</td></tr>
                        <tr class="total-row"><td>Total Deductions</td><td class="amount">${formatIDR(Number(item.totalDeductions))}</td></tr>
                    </tbody>
                </table>

                <table>
                    <tbody>
                        <tr class="net-row"><td>NET SALARY (TAKE HOME PAY)</td><td class="amount">${formatIDR(Number(item.netSalary))}</td></tr>
                    </tbody>
                </table>

                <div class="footer">
                    This document was digitally generated by the HRIS Pro system. Physical signature is not required.<br>
                    Printed on: ${new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
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
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Loading payslips...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent font-sans relative">
            <OfflineBanner />

            <div className="relative z-10 px-4 pt-6 pb-24 max-w-[480px] mx-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight underline decoration-primary/30 underline-offset-8">Payslip</h1>
                    <p className="text-[11px] text-muted-foreground font-black mt-4 uppercase tracking-[0.2em] px-1 opacity-70">Select a period to view the payslip</p>
                </div>

                {periods.length === 0 ? (
                    <div className="glass border-dashed border-border/50 rounded-[32px] p-16 flex flex-col items-center justify-center gap-4 text-center">
                        <Inbox size={48} className="text-muted-foreground opacity-30" strokeWidth={1.5} />
                        <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-60">No payslip available</p>
                    </div>
                ) : (
                    <>
                        {/* Period Selector */}
                        <div className="flex flex-col gap-3">
                            {periods.map((p) => {
                                const isSelected = selected?.month === p.month && selected?.year === p.year;
                                return (
                                    <button
                                        key={`${p.year}-${p.month}`}
                                        id={`payslip-${p.year}-${p.month}`}
                                        onClick={() => fetchDetail(p)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 backdrop-blur-md border hover:translate-x-1 active:scale-[0.98] ${isSelected
                                                ? "glass-accent border-primary/40 shadow-lg shadow-primary/5"
                                                : "glass border-border/50 hover:bg-muted/50"
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
                                            }`}>
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className={`text-sm font-black uppercase tracking-tight ${isSelected ? "text-primary" : "text-foreground"}`}>
                                                {MONTHS[p.month - 1]} {p.year}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-medium font-mono opacity-80">{formatIDR(Number(p.netSalary))}</p>
                                        </div>
                                        <div className={`transition-all duration-300 ${isSelected ? "text-primary rotate-0" : "text-muted-foreground/30"}`}>
                                            {isSelected ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Detail View */}
                        {selected && (
                            <div className="glass border-primary/20 rounded-[32px] p-6 shadow-2xl shadow-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
                                {isLoadingDetail ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    </div>
                                ) : detail ? (
                                    <>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h2 className="text-base font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                                                    <FileCheck className="text-primary" size={20} /> Payslip
                                                </h2>
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 pl-7">{MONTHS[selected.month - 1]} {selected.year}</p>
                                            </div>
                                            <button
                                                id="download-payslip-btn"
                                                onClick={handlePrint}
                                                className="p-2.5 bg-gradient-to-br from-primary to-indigo-600 rounded-xl text-white shadow-lg shadow-primary/30 active:scale-95 transition-all"
                                                title="Download PDF"
                                            >
                                                <Download size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>

                                        <div className="mb-6 px-1">
                                            <p className="text-sm font-black text-foreground uppercase tracking-tight">{detail.payrollItem.employee.fullName}</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">
                                                {detail.payrollItem.employee.position?.title} · {detail.payrollItem.employee.department?.name}
                                            </p>
                                        </div>

                                        <div className="h-px bg-border/50 w-full mb-6" />

                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-4 opacity-70">Earnings</p>
                                        <div className="flex flex-col gap-3.5 mb-6">
                                            {[
                                                { label: "Basic Salary", value: detail.payrollItem.basicSalary },
                                                { label: "Allowances", value: detail.payrollItem.totalAllowances },
                                                { label: "Overtime", value: detail.payrollItem.totalOvertime },
                                                ...(Number(detail.payrollItem.totalIncentives) > 0 ? [{ label: "Incentives & Bonuses", value: detail.payrollItem.totalIncentives }] : []),
                                            ].map((row) => (
                                                <div key={row.label} className="flex justify-between items-center px-1">
                                                    <span className="text-[13px] text-muted-foreground font-medium">{row.label}</span>
                                                    <span className="text-[13px] font-bold text-foreground font-mono">{formatIDR(Number(row.value))}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center px-1 pt-3 border-t border-border/30 mt-1">
                                                <span className="text-[11px] font-black text-foreground uppercase tracking-[0.1em]">Total Gross</span>
                                                <span className="text-base font-black text-foreground font-mono">{formatIDR(Number(detail.payrollItem.grossIncome))}</span>
                                            </div>
                                        </div>

                                        <div className="h-px bg-border/20 w-full mb-6" />

                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-4 opacity-70">Deductions</p>
                                        <div className="flex flex-col gap-3.5 mb-6">
                                            {[
                                                { label: "PPh 21 (Income Tax)", value: detail.payrollItem.pph21Amount },
                                                { label: "BPJS Health", value: detail.payrollItem.bpjsKesEmployee },
                                                { label: "BPJS JHT", value: detail.payrollItem.bpjsTkJhtEmployee },
                                                { label: "BPJS JP", value: detail.payrollItem.bpjsTkJpEmployee },
                                            ].map((row) => (
                                                <div key={row.label} className="flex justify-between items-center px-1">
                                                    <span className="text-[13px] text-muted-foreground font-medium">{row.label}</span>
                                                    <span className="text-[13px] font-bold text-destructive font-mono">-{formatIDR(Number(row.value))}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 rounded-[24px] p-5 flex justify-between items-center border border-primary/20 relative overflow-hidden group">
                                            <div className="absolute -right-4 -bottom-4 text-primary opacity-[0.05] group-hover:rotate-12 transition-transform duration-700">
                                                <Banknote size={80} />
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 opacity-80">Take Home Pay</p>
                                                <p className="text-[24px] font-black text-foreground tracking-tighter font-mono">{formatIDR(Number(detail.payrollItem.netSalary))}</p>
                                            </div>
                                            <div className="relative z-10 opacity-40 bg-background/30 p-2.5 rounded-xl border border-border/50">
                                                <Banknote size={24} className="text-primary" />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-center text-muted-foreground py-10 uppercase font-black tracking-widest opacity-60">Failed to load payslip details</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <EssNav />
        </div>
    );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    FileText,
    Download,
    Inbox,
    ChevronRight,
    Banknote,
    FileCheck
} from "lucide-react";
import { MobileHeader } from "../components/mobile-header";
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
                <title>Payslip – ${periodLabel}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 12px; color: #1c1c1e; margin: 0; padding: 24px; background: #fff; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #007aff; padding-bottom: 16px; margin-bottom: 20px; }
                    .company { font-size: 20px; font-weight: 800; color: #007aff; }
                    .slip-title { font-size: 15px; font-weight: 700; color: #1c1c1e; margin-bottom: 4px; }
                    .period { font-size: 12px; color: #8e8e93; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
                    .info-item label { font-size: 10px; text-transform: uppercase; color: #8e8e93; letter-spacing: 0.05em; font-weight: 600; }
                    .info-item p { margin: 2px 0 0; font-weight: 600; font-size: 13px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                    th { background: #f2f2f7; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #8e8e93; letter-spacing: 0.05em; }
                    td { padding: 8px 10px; border-bottom: 1px solid #e5e5ea; font-size: 12px; }
                    .amount { text-align: right; font-family: monospace; font-weight: 600; }
                    .total-row td { font-weight: 700; background: #f2f2f7; }
                    .net-row td { font-weight: 800; font-size: 14px; background: #007aff; color: #fff; }
                    .footer { margin-top: 24px; font-size: 10px; color: #aeaeb2; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="company">DigiHR+</div>
                        <p style="margin:4px 0 0; color:#8e8e93; font-size:11px;">Employee Self Service Portal</p>
                    </div>
                    <div style="text-align:right">
                        <div class="slip-title">OFFICIAL PAYSLIP</div>
                        <div class="period">Period: ${periodLabel}</div>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-item"><label>Employee</label><p>${emp.fullName}</p></div>
                    <div class="info-item"><label>Employee ID</label><p>${emp.employeeNumber}</p></div>
                    <div class="info-item"><label>Position</label><p>${emp.position?.title || "—"}</p></div>
                    <div class="info-item"><label>Bank</label><p>${emp.bankName || "—"}</p></div>
                </div>

                <table>
                    <thead><tr><th>Earnings</th><th class="amount">Amount</th></tr></thead>
                    <tbody>
                        <tr><td>Basic Salary</td><td class="amount">${formatIDR(Number(item.basicSalary))}</td></tr>
                        <tr><td>Allowances</td><td class="amount">${formatIDR(Number(item.totalAllowances))}</td></tr>
                        <tr><td>Overtime</td><td class="amount">${formatIDR(Number(item.totalOvertime))}</td></tr>
                        <tr class="total-row"><td>Gross Earnings</td><td class="amount">${formatIDR(Number(item.grossIncome))}</td></tr>
                    </tbody>
                </table>

                <table>
                    <thead><tr><th>Deductions</th><th class="amount">Amount</th></tr></thead>
                    <tbody>
                        <tr><td>Tax (PPh 21)</td><td class="amount">-${formatIDR(Number(item.pph21Amount))}</td></tr>
                        <tr><td>BPJS Health</td><td class="amount">-${formatIDR(Number(item.bpjsKesEmployee))}</td></tr>
                        <tr><td>BPJS JHT</td><td class="amount">-${formatIDR(Number(item.bpjsTkJhtEmployee))}</td></tr>
                        <tr class="total-row"><td>Total Deductions</td><td class="amount">${formatIDR(Number(item.totalDeductions))}</td></tr>
                    </tbody>
                </table>

                <table style="margin-top:20px">
                    <tbody>
                        <tr class="net-row"><td>TAKE HOME PAY</td><td class="amount">${formatIDR(Number(item.netSalary))}</td></tr>
                    </tbody>
                </table>

                <div class="footer">
                    Generated by DigiHR+ System. Confidential Document.
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
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 pb-28">
            <OfflineBanner />
            <MobileHeader
                title="Payslip"
                rightAction={detail && (
                    <button
                        onClick={handlePrint}
                        className="p-2 text-primary active:opacity-50"
                        title="Download"
                    >
                        <Download size={24} strokeWidth={2} />
                    </button>
                )}
            />

            <div className="pt-2">
                {periods.length === 0 ? (
                    <div className="ios-empty-state mt-8">
                        <div className="ios-empty-state-icon w-20 h-20 rounded-full bg-primary/10 text-primary opacity-100">
                            <Inbox size={32} strokeWidth={1.5} />
                        </div>
                        <p className="ios-empty-state-text">No Payslips Yet</p>
                        <p className="ios-empty-state-subtext">Your payslips will appear here once payroll has been processed by HR.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {/* Period Selector */}
                        <div className="ios-list-group">
                            <h2 className="ios-list-header">History</h2>
                            <div className="ios-list-content">
                                {periods.map((p) => {
                                    const isSelected = selected?.month === p.month && selected?.year === p.year;
                                    return (
                                        <button
                                            key={`${p.year}-${p.month}`}
                                            id={`payslip-${p.year}-${p.month}`}
                                            onClick={() => fetchDetail(p)}
                                            className="ios-cell w-full text-left"
                                        >
                                            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-primary/10 text-primary">
                                                <FileText size={20} strokeWidth={2} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[17px] ${isSelected ? "font-bold text-primary" : "font-normal text-[var(--ios-label)]"}`}>
                                                    {MONTHS[p.month - 1]} {p.year}
                                                </p>
                                                <p className="text-[13px] text-[var(--ios-secondary-label)] font-medium font-mono">
                                                    {formatIDR(Number(p.netSalary))}
                                                </p>
                                            </div>
                                            <ChevronRight className="ios-chevron" size={18} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Detail View */}
                        {selected && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {isLoadingDetail ? (
                                    <div className="flex justify-center py-12">
                                        <div className="w-6 h-6 border-[2.5px] border-primary/20 border-t-primary rounded-full animate-spin" />
                                    </div>
                                ) : detail ? (
                                    <div className="flex flex-col gap-8">
                                        {/* Employee Info Header */}
                                        <div className="px-5">
                                            <h3 className="text-[20px] font-bold text-[var(--ios-label)]">{detail.payrollItem.employee.fullName}</h3>
                                            <p className="text-[15px] text-[var(--ios-secondary-label)] font-medium">
                                                {detail.payrollItem.employee.position?.title} · {detail.payrollItem.employee.department?.name}
                                            </p>
                                            <p className="text-[13px] text-[var(--ios-secondary-label)] font-medium mt-1">
                                                Period: {MONTHS[selected.month - 1]} {selected.year}
                                            </p>
                                        </div>

                                        {/* Earnings */}
                                        <div className="ios-list-group">
                                            <h2 className="ios-list-header">Earnings</h2>
                                            <div className="ios-list-content">
                                                {[
                                                    { label: "Basic Salary", value: detail.payrollItem.basicSalary },
                                                    { label: "Allowances", value: detail.payrollItem.totalAllowances },
                                                    { label: "Overtime", value: detail.payrollItem.totalOvertime },
                                                    ...(Number(detail.payrollItem.totalIncentives) > 0 ? [{ label: "Incentives", value: detail.payrollItem.totalIncentives }] : []),
                                                ].map((row) => (
                                                    <div key={row.label} className="ios-cell">
                                                        <span className="text-[17px] flex-1 font-normal text-[var(--ios-label)]">{row.label}</span>
                                                        <span className="text-[17px] font-semibold text-[var(--ios-label)] font-mono">{formatIDR(Number(row.value))}</span>
                                                    </div>
                                                ))}
                                                <div className="ios-cell bg-primary/5">
                                                    <span className="text-[17px] flex-1 font-bold text-primary">Gross Earnings</span>
                                                    <span className="text-[17px] font-bold text-primary font-mono">{formatIDR(Number(detail.payrollItem.grossIncome))}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Deductions */}
                                        <div className="ios-list-group">
                                            <h2 className="ios-list-header">Deductions</h2>
                                            <div className="ios-list-content">
                                                {[
                                                    { label: "Tax (PPh 21)", value: detail.payrollItem.pph21Amount },
                                                    { label: "BPJS Health", value: detail.payrollItem.bpjsKesEmployee },
                                                    { label: "BPJS JHT", value: detail.payrollItem.bpjsTkJhtEmployee },
                                                    { label: "BPJS JP", value: detail.payrollItem.bpjsTkJpEmployee },
                                                ].map((row) => (
                                                    <div key={row.label} className="ios-cell">
                                                        <span className="text-[17px] flex-1 font-normal text-[var(--ios-label)]">{row.label}</span>
                                                        <span className="text-[17px] font-semibold text-destructive font-mono">-{formatIDR(Number(row.value))}</span>
                                                    </div>
                                                ))}
                                                <div className="ios-cell">
                                                    <span className="text-[17px] flex-1 font-bold text-[var(--ios-label)]">Total Deductions</span>
                                                    <span className="text-[17px] font-bold text-destructive font-mono">{formatIDR(Number(detail.payrollItem.totalDeductions))}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Final Summary Card */}
                                        <div className="px-4">
                                            <div className="bg-[#007aff] rounded-3xl p-6 shadow-lg shadow-primary/20 relative overflow-hidden group">
                                                <div className="absolute right-0 bottom-0 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                                    <Banknote size={120} />
                                                </div>
                                                <div className="relative z-10">
                                                    <p className="text-[13px] font-bold text-white/70 uppercase tracking-wider mb-1">Take Home Pay</p>
                                                    <p className="text-[34px] font-bold text-white tracking-tight font-mono">
                                                        {formatIDR(Number(detail.payrollItem.netSalary))}
                                                    </p>
                                                    <div className="mt-4 flex items-center gap-2 text-[13px] text-white/80 font-medium">
                                                        <FileCheck size={16} /> Digitally Verified Document
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-5 text-center text-destructive font-medium py-10">
                                        Failed to load details
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <EssNav />
        </div>
    );
}

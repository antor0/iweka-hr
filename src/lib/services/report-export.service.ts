import ExcelJS from 'exceljs';
import { formatIDR } from '@/lib/utils';
import { format } from 'date-fns';

export class ReportExportService {
    /**
     * Generate an Excel file buffer from data and column definitions
     */
    static async generateExcel(data: any[], columns: { header: string; key: string; width?: number; type?: 'currency' | 'date' | 'number' | 'string' }[], sheetName: string = 'Report'): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'HRIS System';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(sheetName);

        // Define columns
        worksheet.columns = columns.map(col => ({
            header: col.header,
            key: col.key,
            width: col.width || 20
        }));

        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' } // Indigo color
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Add data
        if (data && data.length > 0) {
            worksheet.addRows(data);
        }

        // Apply formatting based on column types
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            row.eachCell((cell, colNumber) => {
                const colDef = columns[colNumber - 1];
                if (!colDef) return;

                if (colDef.type === 'currency' && typeof cell.value === 'number') {
                    cell.numFmt = '"Rp"#,##0.00';
                } else if (colDef.type === 'date' && cell.value) {
                    // Try to format date nicely
                    try {
                        const date = new Date(cell.value as any);
                        if (!isNaN(date.getTime())) {
                             cell.value = format(date, 'dd MMM yyyy');
                        }
                    } catch (e) {
                         // Ignore formatting errors
                    }
                }
            });
        });

        // Add borders to all cells with data
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
                };
            });
        });

        // Write to buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Generate a CSV string from data and column definitions
     */
    static generateCSV(data: any[], columns: { header: string; key: string }[]): string {
        if (!data || data.length === 0) {
            return columns.map(c => `"${c.header}"`).join(',') + '\n';
        }

        const headerRow = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
        
        const dataRows = data.map(row => {
            return columns.map(col => {
                let val = row[col.key];
                if (val === null || val === undefined) val = '';
                
                // Convert objects (like dates) to strings
                if (val instanceof Date) {
                    val = format(val, 'yyyy-MM-dd HH:mm:ss');
                } else if (typeof val === 'object') {
                    val = JSON.stringify(val);
                }
                
                // Escape quotes
                const stringVal = String(val).replace(/"/g, '""');
                return `"${stringVal}"`;
            }).join(',');
        });

        return [headerRow, ...dataRows].join('\n');
    }
}

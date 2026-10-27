/**
 * generateStatement.js — PDF Statement Generator
 *
 * Ported from payment_gateway.js. Uses jsPDF via npm import.
 * This module is designed to be LAZY LOADED:
 *   const { generateStatement } = await import('../lib/generateStatement');
 *
 * This keeps ~300KB of jsPDF out of the initial app bundle.
 */

import jsPDF from 'jspdf';
import { fetchLegalName } from './api/earnings.js';

/**
 * Generate a Professional PDF Earnings Statement
 * @param {Object} userData - User profile data { id, name, username, full_name }
 * @param {Object} earningsData - Earnings data { total, lastMonth, logs }
 */
export async function generateStatement(userData, earningsData) {
    try {
        const doc = new jsPDF();
        const now = new Date();
        const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
        const statementID = 'PO-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Helper to sanitize text (strip non-ASCII)
        const clean = (txt) => {
            if (!txt) return '';
            return String(txt).replace(/[^\x00-\x7F]/g, '').trim();
        };

        // ── 1. CORPORATE HEADER ──
        doc.setFillColor(30, 41, 59); // Slate 800
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('PLUSOPINION', 15, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text('Partner Program • Earning Statement', 15, 33);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('Statement ID:', 150, 20);
        doc.setFont('helvetica', 'bold');
        doc.text(statementID, 150, 25);
        doc.setFont('helvetica', 'normal');
        doc.text('Date:', 150, 32);
        doc.text(now.toLocaleDateString('en-IN'), 160, 32);

        // ── 2. PARTNER DATA & COMPANY ADDRESS ──
        let topY = 60;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PARTNER INFORMATION', 15, topY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Fetch Legal Name from partner_applications table
        let userName = userData.full_name || userData.name || 'PlusOpinion Partner';
        try {
            const legalName = await fetchLegalName(userData.id);
            if (legalName) userName = legalName;
        } catch (e) {
            console.warn('Could not fetch legal name for PDF:', e);
        }

        doc.text(clean(userName), 15, topY + 7);
        doc.setTextColor(100, 100, 100);
        doc.text(`ID: ${clean(userData.username || 'N/A')}`, 15, topY + 13);

        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text('ISSUED BY', 130, topY);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PlusOpinion Technologies', 130, topY + 7);
        doc.setTextColor(100, 100, 100);
        doc.text('Revenue Operations Dept.', 130, topY + 13);
        doc.text('Bangalore, KA, India', 130, topY + 19);

        // ── 3. EARNINGS SUMMARY CARD ──
        let summaryY = 100;
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.rect(15, summaryY, 180, 25, 'FD');

        doc.setTextColor(71, 85, 105); // Slate 600
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Earnings Period:', 25, summaryY + 15);
        doc.setFont('helvetica', 'normal');
        doc.text(monthYear, 60, summaryY + 15);

        doc.setTextColor(30, 41, 59);
        doc.text('NET EARNINGS:', 120, summaryY + 15);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const totalVal = Number(earningsData.total) || 0;
        doc.text(`INR ${totalVal.toLocaleString('en-IN')}`, 155, summaryY + 15);

        // ── 4. TRANSACTION DETAILS TABLE ──
        let tableY = 145;
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('TRANSACTION HISTORY', 15, tableY - 10);

        // Table Header
        doc.setFillColor(241, 245, 249); // Slate 100
        doc.rect(15, tableY - 5, 180, 10, 'F');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('DATE', 18, tableY + 1);
        doc.text('DESCRIPTION', 45, tableY + 1);
        doc.text('SOURCE', 115, tableY + 1);
        doc.text('STATUS', 145, tableY + 1);
        doc.text('AMOUNT', 175, tableY + 1);

        // Table Rows
        let rowY = tableY + 12;
        const logs = Array.isArray(earningsData.logs) ? earningsData.logs : [];
        logs.forEach((log, index) => {
            if (rowY > 260) {
                doc.addPage();
                rowY = 20;
            }

            // Zebra striping
            if (index % 2 === 1) {
                doc.setFillColor(248, 250, 252);
                doc.rect(15, rowY - 6, 180, 9, 'F');
            }

            const date = log.created_at
                ? new Date(log.created_at).toLocaleDateString('en-IN')
                : (log.date || '-');

            doc.setTextColor(30, 41, 59);
            doc.text(date, 18, rowY);
            doc.text(clean(log.label || log.description) || 'Transaction', 45, rowY);
            doc.text(
                clean(log.source) || (log.method ? `Withdrawal (${log.method.toUpperCase()})` : '-'),
                115, rowY
            );

            // Status with color
            const status = clean(log.status || 'Paid');
            if (status === 'Paid' || status === 'paid') {
                doc.setTextColor(22, 101, 52); // Green 800
                doc.text('Completed', 145, rowY);
            } else if (status === 'Pending' || status === 'pending') {
                doc.setTextColor(154, 52, 18); // Orange 800
                doc.text('Processing', 145, rowY);
            } else {
                doc.setTextColor(100, 100, 100);
                doc.text(status, 145, rowY);
            }

            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            const amountPrefix = Number(log.amount) < 0 ? '-' : '';
            doc.text(`${amountPrefix}₹${Math.abs(Number(log.amount)).toLocaleString('en-IN')}`, 175, rowY);
            doc.setFont('helvetica', 'normal');

            doc.setDrawColor(241, 245, 249);
            doc.line(15, rowY + 3, 195, rowY + 3);
            rowY += 10;
        });

        if (logs.length === 0) {
            doc.setTextColor(150, 150, 150);
            doc.text('No earnings activity for this period.', 15, rowY + 10);
        }

        // ── 5. FOOTER & COMPLIANCE ──
        let footerY = 275;
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.line(15, footerY - 5, 195, footerY - 5);
        doc.text('PlusOpinion Partner Program • Internal Revenue Document', 105, footerY, { align: 'center' });
        doc.text('This is an electronically generated document. No signature is required.', 105, footerY + 5, { align: 'center' });
        doc.text('For queries, contact partners@plusopinion.com', 105, footerY + 10, { align: 'center' });

        // ── DELIVERY ──
        const fileName = `PlusOpinion_Statement_${monthYear.replace(/ /g, '_')}.pdf`;
        const pdfBlob = doc.output('blob');
        const blobUrl = window.URL.createObjectURL(pdfBlob);

        window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: 'Professional Statement Prepared!', icon: 'Check', isSuccess: true }
        }));

        const newTab = window.open(blobUrl, '_blank');
        if (!newTab) {
            // Fallback: direct download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => document.body.removeChild(link), 1000);
        }

        // Clean up blob after 1 minute
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);

    } catch (error) {
        console.error('PDF Generation Failed:', error);
        window.dispatchEvent(new CustomEvent('toast', {
            detail: { message: 'PDF Generation Error', icon: 'AlertTriangle' }
        }));
    }
}

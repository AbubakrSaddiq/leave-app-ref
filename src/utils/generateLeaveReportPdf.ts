// ============================================
// Generate Leave Report PDF (Client-Side)
// Uses jsPDF for in-browser PDF generation
// ============================================

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LeaveReportData } from '@/api/reports.api';
import type { LeaveReportFilters } from '@/api/reports.api';
import { formatDate } from '@/utils/date.utils';

export async function generateLeaveReportPdf(
  reports: LeaveReportData[],
  filters: LeaveReportFilters
): Promise<void> {
  // Create PDF in landscape orientation
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors
  const primaryBlue = '#2E75B6';
  const lightGray = '#F9F9F9';
  const darkGray = '#666666';

  // ─────────────────────────────────────────────────────────────
  // Title
  // ─────────────────────────────────────────────────────────────
  doc.setFontSize(24);
  doc.setTextColor(primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('LEAVE MANAGEMENT REPORT', pageWidth / 2, 50, { align: 'center' });

  // ─────────────────────────────────────────────────────────────
  // Metadata
  // ─────────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'normal');
  
  const genDate = formatDate(new Date().toISOString(), "MMMM dd, yyyy 'at' HH:mm");
  doc.text(`Generated: ${genDate}`, pageWidth / 2, 70, { align: 'center' });

  // Filter summary
  const filterParts = [];
  if (filters.startDate) filterParts.push(`From: ${formatDate(filters.startDate)}`);
  if (filters.endDate) filterParts.push(`To: ${formatDate(filters.endDate)}`);
  if (filters.leaveType) filterParts.push(`Type: ${filters.leaveType.toUpperCase()}`);
  
  const filterText = filterParts.length > 0
    ? filterParts.join(' | ')
    : 'All approved leave applications';
  
  doc.setFont('helvetica', 'bold');
  doc.text(filterText, pageWidth / 2, 88, { align: 'center' });

  // ─────────────────────────────────────────────────────────────
  // Summary Statistics
  // ─────────────────────────────────────────────────────────────
  let yPos = 120;
  
  doc.setFontSize(14);
  doc.setTextColor(primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 40, yPos);
  
  yPos += 20;
  
  const totalApps = reports.length;
  const totalDays = reports.reduce((sum, r) => sum + r.working_days, 0);
  
  doc.setFontSize(11);
  doc.setTextColor('#000000');
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Approved Applications: `, 40, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalApps}`, 230, yPos);
  
  yPos += 18;
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Working Days: `, 40, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalDays}`, 230, yPos);

  // ─────────────────────────────────────────────────────────────
  // Detailed Records Table
  // ─────────────────────────────────────────────────────────────
  yPos += 35;
  
  doc.setFontSize(14);
  doc.setTextColor(primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Leave Records', 40, yPos);
  
  yPos += 15;

  // Prepare table data
  const tableData = reports.map((report) => {
    const user = report.user;
    const dept = user.department;
    const designation = user.designation;
    
    return [
      report.application_number,
      `${user.full_name}\n${designation?.name || ''}`,
      dept?.code || '—',
      report.leave_type.toUpperCase(),
      `${formatDate(report.start_date, 'MMM dd')} -\n${formatDate(report.end_date, 'MMM dd, yyyy')}`,
      report.working_days.toString(),
      [
        report.director_approved_at ? `Dir: ${formatDate(report.director_approved_at, 'MMM dd')}` : '',
        report.hr_approved_at ? `HR: ${formatDate(report.hr_approved_at, 'MMM dd')}` : '',
      ].filter(Boolean).join('\n') || '—',
      [
        report.director_comments ? `Dir: ${report.director_comments}` : '',
        report.hr_comments ? `HR: ${report.hr_comments}` : '',
      ].filter(Boolean).join('\n') || '—',
    ];
  });

  // Generate table using autoTable
  autoTable(doc, {
    startY: yPos,
    head: [[
      'App #',
      'Employee',
      'Dept',
      'Type',
      'Period',
      'Days',
      'Approvals',
      'Comments',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryBlue,
      textColor: '#FFFFFF',
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 8,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 6,
      valign: 'top',
    },
    alternateRowStyles: {
      fillColor: lightGray,
    },
    columnStyles: {
      0: { cellWidth: 60, fontSize: 8 },  // App #
      1: { cellWidth: 110 },              // Employee
      2: { cellWidth: 45 },               // Dept
      3: { cellWidth: 50 },               // Type
      4: { cellWidth: 100, fontSize: 8 }, // Period
      5: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }, // Days
      6: { cellWidth: 85, fontSize: 8 },  // Approvals
      7: { cellWidth: 170, fontSize: 8 }, // Comments
    },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      // Add footer on each page
      const footerY = pageHeight - 30;
      doc.setFontSize(9);
      doc.setTextColor('#999999');
      doc.setFont('helvetica', 'italic');
      doc.text(
        'This is a confidential document. For authorized personnel only.',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
    },
  });

  // ─────────────────────────────────────────────────────────────
  // Save PDF
  // ─────────────────────────────────────────────────────────────
  const filename = `Leave_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
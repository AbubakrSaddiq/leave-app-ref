// ============================================
// Generate Single Leave Application PDF
// Creates a detailed PDF for one leave record
// ============================================

import jsPDF from 'jspdf';
import type { LeaveReportData } from '@/api/reports.api';
import { formatDate } from '@/utils/date.utils';

export async function generateSingleLeaveReportPdf(
  leave: LeaveReportData
): Promise<void> {
  // Create PDF in portrait orientation
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 50;
  const contentWidth = pageWidth - (2 * margin);
  
  // Colors
  const primaryBlue = '#2E75B6';
  const darkGray = '#333333';
  const lightGray = '#666666';
  const veryLightGray = '#F5F5F5';

  let yPos = 60;

  // ─────────────────────────────────────────────────────────────
  // Header with border
  // ─────────────────────────────────────────────────────────────
//   doc.setDrawColor(primaryBlue);
//   doc.setLineWidth(2);
//   doc.line(margin, yPos - 10, pageWidth - margin, yPos - 10);

  doc.setFontSize(24);
  doc.setTextColor(primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('LEAVE APPLICATION', pageWidth / 2, yPos, { align: 'center' });

  yPos += 30;

  doc.setFontSize(16);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text(leave.application_number, pageWidth / 2, yPos, { align: 'center' });

  yPos += 10;
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 30;

  // ─────────────────────────────────────────────────────────────
  // Employee Information Section
  // ─────────────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setTextColor(primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('EMPLOYEE INFORMATION', margin, yPos);
  yPos += 20;

  // Background box
  doc.setFillColor(veryLightGray);
  doc.rect(margin, yPos - 5, contentWidth, 90, 'F');

  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  
  // Full Name
  doc.text('Full Name', margin + 10, yPos + 10);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text(leave.user.full_name, margin + 10, yPos + 25);

  // Email
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Email', pageWidth / 2 + 10, yPos + 10);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'normal');
  doc.text(leave.user.email, pageWidth / 2 + 10, yPos + 25);

  yPos += 45;

  // Department
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Department', margin + 10, yPos + 10);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  const deptText = leave.user.department 
    ? `${leave.user.department.code} - ${leave.user.department.name}`
    : 'N/A';
  doc.text(deptText, margin + 10, yPos + 25);

  // Designation
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Designation', pageWidth / 2 + 10, yPos + 10);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'normal');
  doc.text(leave.user.designation?.name || 'N/A', pageWidth / 2 + 10, yPos + 25);

  yPos += 50;

  // ─────────────────────────────────────────────────────────────
  // Leave Details Section
  // ─────────────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setTextColor(primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('LEAVE DETAILS', margin, yPos);
  yPos += 20;

  // Background box
  doc.setFillColor(veryLightGray);
  doc.rect(margin, yPos - 5, contentWidth, 130, 'F');

  doc.setFontSize(10);
  
  // Leave Type
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Leave Type', margin + 10, yPos + 10);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(leave.leave_type.toUpperCase(), margin + 10, yPos + 28);

  // Working Days
  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Working Days', pageWidth / 2 + 10, yPos + 10);
  doc.setTextColor(primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${leave.working_days} days`, pageWidth / 2 + 10, yPos + 28);

  yPos += 50;

  // Start Date
  doc.setFontSize(10);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Start Date', margin + 10, yPos + 10);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(leave.start_date, 'MMMM dd, yyyy'), margin + 10, yPos + 25);

  // End Date
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('End Date', pageWidth / 2 + 10, yPos + 10);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'bold');
  doc.text(formatDate(leave.end_date, 'MMMM dd, yyyy'), pageWidth / 2 + 10, yPos + 25);

  yPos += 50;

  // Reason
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Reason', margin + 10, yPos + 10);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'normal');
  
  // Wrap reason text
  const reasonLines = doc.splitTextToSize(
    leave.reason || 'No reason provided',
    contentWidth - 20
  );
  doc.text(reasonLines, margin + 10, yPos + 25);

  yPos += 25 + (reasonLines.length * 12) + 20;

  // ─────────────────────────────────────────────────────────────
  // Approval Information Section
  // ─────────────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setTextColor(primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVAL INFORMATION', margin, yPos);
  yPos += 20;

  // Status Badge
  doc.setFillColor('#48BB78'); // Green
  doc.setDrawColor('#48BB78');
  doc.roundedRect(margin, yPos - 5, 80, 20, 3, 3, 'FD');
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('APPROVED', margin + 40, yPos + 8, { align: 'center' });

  yPos += 30;

  // Director Approval
  if (leave.director_approved_at) {
    doc.setFillColor('#E6F7ED'); // Light green
    doc.setDrawColor('#48BB78');
    doc.setLineWidth(2);
    doc.rect(margin, yPos, contentWidth, 45, 'FD');

    doc.setFontSize(11);
    doc.setTextColor('#2F855A'); // Dark green
    doc.setFont('helvetica', 'bold');
    doc.text('✓ Director Approval', margin + 10, yPos + 15);

    doc.setFontSize(9);
    doc.setTextColor(lightGray);
    doc.setFont('helvetica', 'normal');
    doc.text(
      formatDate(leave.director_approved_at, "MMMM dd, yyyy 'at' HH:mm"),
      pageWidth - margin - 10,
      yPos + 15,
      { align: 'right' }
    );

    if (leave.director_comments) {
      doc.setFontSize(9);
      doc.setTextColor(darkGray);
      doc.text('Comments:', margin + 10, yPos + 28);
      const commentLines = doc.splitTextToSize(
        leave.director_comments,
        contentWidth - 90
      );
      doc.text(commentLines, margin + 70, yPos + 28);
    }

    yPos += 55;
  }

  // HR Approval
  if (leave.hr_approved_at) {
    doc.setFillColor('#EBF4FF'); // Light blue
    doc.setDrawColor(primaryBlue);
    doc.setLineWidth(2);
    doc.rect(margin, yPos, contentWidth, 45, 'FD');

    doc.setFontSize(11);
    doc.setTextColor('#2C5282'); // Dark blue
    doc.setFont('helvetica', 'bold');
    doc.text('✓ HR Approval', margin + 10, yPos + 15);

    doc.setFontSize(9);
    doc.setTextColor(lightGray);
    doc.setFont('helvetica', 'normal');
    doc.text(
      formatDate(leave.hr_approved_at, "MMMM dd, yyyy 'at' HH:mm"),
      pageWidth - margin - 10,
      yPos + 15,
      { align: 'right' }
    );

    if (leave.hr_comments) {
      doc.setFontSize(9);
      doc.setTextColor(darkGray);
      doc.text('Comments:', margin + 10, yPos + 28);
      const commentLines = doc.splitTextToSize(
        leave.hr_comments,
        contentWidth - 90
      );
      doc.text(commentLines, margin + 70, yPos + 28);
    }

    yPos += 55;
  }

  // ─────────────────────────────────────────────────────────────
  // Application Metadata
  // ─────────────────────────────────────────────────────────────
  yPos += 10;
  doc.setFillColor(veryLightGray);
  doc.rect(margin, yPos, contentWidth, 40, 'F');

  doc.setFontSize(8);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  doc.text('Application Submitted', margin + 10, yPos + 15);
  doc.setTextColor(darkGray);
  doc.setFont('helvetica', 'normal');
  doc.text(
    formatDate(leave.created_at, "MMM dd, yyyy 'at' HH:mm"),
    margin + 10,
    yPos + 28
  );

  if (leave.updated_at && leave.updated_at !== leave.created_at) {
    doc.setTextColor(lightGray);
    doc.text('Last Updated', pageWidth / 2 + 10, yPos + 15);
    doc.setTextColor(darkGray);
    doc.text(
      formatDate(leave.updated_at, "MMM dd, yyyy 'at' HH:mm"),
      pageWidth / 2 + 10,
      yPos + 28
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Footer
  // ─────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor('#CCCCCC');
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  doc.setFontSize(8);
  doc.setTextColor('#999999');
  doc.setFont('helvetica', 'italic');
  doc.text(
    'This is an official leave application record. For authorized personnel only.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // ─────────────────────────────────────────────────────────────
  // Save PDF
  // ─────────────────────────────────────────────────────────────
  const filename = `Leave_Application_${leave.application_number}.pdf`;
  doc.save(filename);
}
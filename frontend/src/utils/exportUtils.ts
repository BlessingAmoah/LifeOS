/**
 * Export utilities for CSV and PDF generation
 */

/**
 * Export data to CSV
 */
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    csvHeaders.join(','), // Header row
    ...data.map(row => 
      csvHeaders.map(header => {
        const value = row[header];
        // Handle arrays, objects, and null/undefined
        if (Array.isArray(value)) {
          return `"${value.join('; ')}"`;
        }
        if (value === null || value === undefined) {
          return '';
        }
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value).replace(/"/g, '""');
        return stringValue.includes(',') || stringValue.includes('\n') 
          ? `"${stringValue}"` 
          : stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to PDF (simple text-based PDF using jsPDF)
 * Note: This requires jsPDF library to be installed
 */
export const exportToPDF = async (
  title: string,
  data: any[],
  columns: { key: string; label: string }[],
  filename: string
) => {
  try {
    // Dynamic import of jsPDF (install with: npm install jspdf)
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 22);
    
    // Table data
    const tableData = data.map(row => 
      columns.map(col => {
        const value = row[col.key];
        if (Array.isArray(value)) {
          return value.join('; ');
        }
        return value !== null && value !== undefined ? String(value) : '';
      })
    );
    
    // Add table (simple implementation)
    let yPos = 30;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    
    // Headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    columns.forEach((col, index) => {
      doc.text(col.label, 14 + (index * 40), yPos);
    });
    yPos += lineHeight;
    
    // Data rows
    doc.setFont('helvetica', 'normal');
    tableData.forEach((row) => {
      // Check if we need a new page
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 15;
      }
      
      row.forEach((cell, colIndex) => {
        const text = String(cell).substring(0, 20); // Truncate long text
        doc.text(text, 14 + (colIndex * 40), yPos);
      });
      yPos += lineHeight;
    });
    
    // Save
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDF export requires jsPDF library. Install with: npm install jspdf');
  }
};

/**
 * Export journals to CSV
 */
export const exportJournalsToCSV = (journals: any[]) => {
  const data = journals.map(j => ({
    'Date': j.created_at?.split('T')[0] || '',
    'Title': j.title || '',
    'Category': j.category || '',
    'Mood': j.mood || '',
    'Tags': j.tags?.join('; ') || '',
    'Content': j.content?.substring(0, 200) || '',
  }));
  exportToCSV(data, 'journals-export');
};

/**
 * Export tasks to CSV
 */
export const exportTasksToCSV = (tasks: any[]) => {
  const data = tasks.map(t => ({
    'Title': t.title || '',
    'Status': t.status || '',
    'Priority': t.priority || '',
    'Due Date': t.due_date || '',
    'Description': t.description?.substring(0, 200) || '',
  }));
  exportToCSV(data, 'tasks-export');
};

/**
 * Export habits to CSV
 */
export const exportHabitsToCSV = (habits: any[]) => {
  const data = habits.map(h => ({
    'Name': h.name || '',
    'Category': h.category || '',
    'Frequency': h.frequency || '',
    'Weekly Success Rate': `${h.weekly_success_rate || 0}%`,
    'Total Completions': h.total_completions || 0,
  }));
  exportToCSV(data, 'habits-export');
};

/**
 * Export health logs to CSV
 */
export const exportHealthLogsToCSV = (logs: any[]) => {
  const data = logs.map(l => ({
    'Date': l.logged_on || '',
    'Sleep Hours': l.sleep_hours || '',
    'Energy Level': l.energy_level || '',
    'Exercise': l.exercise || '',
    'Weight': l.weight || '',
    'Heart Rate': l.heart_rate || '',
    'Blood Pressure': l.blood_pressure_systolic && l.blood_pressure_diastolic 
      ? `${l.blood_pressure_systolic}/${l.blood_pressure_diastolic}` 
      : '',
    'Mental Health Score': l.mental_health_score || '',
    'Mood': l.mood || '',
    'Stress Level': l.stress_level || '',
    'Notes': l.notes || '',
  }));
  exportToCSV(data, 'health-logs-export');
};

/**
 * Export transactions to CSV
 */
export const exportTransactionsToCSV = (transactions: any[]) => {
  const data = transactions.map(t => ({
    'Date': t.transaction_date || '',
    'Type': t.type || '',
    'Amount': t.amount || '',
    'Category': t.category || '',
    'Description': t.description || '',
    'Payment Method': t.payment_method || '',
    'Account': t.account || '',
    'Tags': t.tags?.join('; ') || '',
  }));
  exportToCSV(data, 'transactions-export');
};

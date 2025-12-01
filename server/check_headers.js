const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '../Assets Report.xlsx');

try {
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get headers from Row 2 (index 2)
    const headers = [];
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const R = 2; // Row index 2
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        const cell = sheet[cell_ref];
        headers.push(cell ? cell.v : undefined);
    }
    console.log('Headers at Row 2:', headers);

} catch (error) {
    console.error('Error:', error.message);
}

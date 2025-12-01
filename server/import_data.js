const XLSX = require('xlsx');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./assets.db');

const excelPath = path.join(__dirname, '../Assets Report.xlsx');

function importData() {
    try {
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Start from Row 2 (index 2) for headers
        const data = XLSX.utils.sheet_to_json(sheet, { range: 2 });

        console.log(`Found ${data.length} records.`);
        if (data.length > 0) {
            console.log('Sample keys:', Object.keys(data[0]));
        }

        db.serialize(() => {
            db.run("DELETE FROM assets", (err) => {
                if (err) console.error(err);

                const stmt = db.prepare(`INSERT INTO assets (
          asset_name, asset_type, manufacture, status, department, asset_holder, designation, emp_id,
          sub_department, location, model, serial_no, processor, ram, hard_disk, os, sub_system,
          supplier, purchase_date, warranty_start, warranty_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

                let successCount = 0;

                db.run("BEGIN TRANSACTION");

                data.forEach((row) => {
                    try {
                        // Map based on the keys we saw
                        // Note: 'undefined' headers might become __EMPTY

                        const asset_name = row['Asset Name'];
                        if (!asset_name) return; // Skip empty rows

                        const asset_type = row['Asset Type'];
                        const manufacture = row['Manufacture'];
                        const status = row['Status'];
                        const department = row['Department'];
                        const asset_holder = row['Asset Holder'];
                        const designation = row['Designation'];
                        const emp_id = row['EMP ID'];
                        const sub_department = row['Sub Department'];
                        const location = row['Location'];
                        const model = row['Model'];
                        const serial_no = row['Serial No.'];
                        const processor = row['Processor'];
                        const ram = row['RAM'];
                        const hard_disk = row['Hard disk'];
                        const os = row['Operating System'];
                        const sub_system = row['Sub System'];

                        // Handle the columns that might have missing headers
                        // Based on the data inspection:
                        // 18: undefined
                        // 19: Supplier
                        // 20: Date of Purchase
                        // 21: Warranty Start
                        // 22: Warranty End

                        // If headers are missing, sheet_to_json might name them __EMPTY_1, etc.
                        // Let's try to grab them by checking the object keys or just using the likely names if they exist
                        // Actually, if the header cell was undefined, it might not be in the JSON if the cell is also empty?
                        // But if the data has value, it will be __EMPTY_x.

                        // Let's assume the headers might be:
                        const supplier = row['Supplier'] || row['__EMPTY_1'];
                        const purchase_date_raw = row['Date of Purchase'] || row['__EMPTY_2'];
                        const warranty_start_raw = row['Warranty Start Date'] || row['__EMPTY_3'];
                        const warranty_end_raw = row['Warranty End Date'] || row['__EMPTY_4'];

                        const formatDate = (val) => {
                            if (!val) return '';
                            if (typeof val === 'number') {
                                const date = new Date(Math.round((val - 25569) * 86400 * 1000));
                                return date.toISOString().split('T')[0];
                            }
                            return val;
                        };

                        stmt.run(
                            asset_name, asset_type, manufacture, status, department, asset_holder, designation, emp_id,
                            sub_department, location, model, serial_no, processor, ram, hard_disk, os, sub_system,
                            supplier, formatDate(purchase_date_raw), formatDate(warranty_start_raw), formatDate(warranty_end_raw)
                        );
                        successCount++;
                    } catch (err) {
                        console.error(err);
                    }
                });

                stmt.finalize();
                db.run("COMMIT", () => {
                    console.log(`Imported ${successCount} records.`);
                });
            });
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

importData();

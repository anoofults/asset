const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(bodyParser.json());

// Get all assets
app.get('/api/assets', (req, res) => {
    const { search, status } = req.query;
    let query = "SELECT * FROM assets";
    let params = [];
    let conditions = [];

    if (search) {
        conditions.push(`(
      asset_name LIKE ? OR 
      serial_no LIKE ? OR 
      emp_id LIKE ? OR 
      asset_holder LIKE ? OR
      model LIKE ?
    )`);
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    if (status && status !== 'All') {
        conditions.push("status = ?");
        params.push(status);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: rows
        });
    });
});

// Get single asset by ID
app.get('/api/assets/:id', (req, res) => {
    const sql = "SELECT * FROM assets WHERE id = ?";
    const params = [req.params.id];
    db.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: "success",
            data: row
        });
    });
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { range: 2 }); // Start from row 2

        db.serialize(() => {
            db.run("DELETE FROM assets", (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Database error' });
                }

                const stmt = db.prepare(`INSERT INTO assets (
          asset_name, asset_type, manufacture, status, department, asset_holder, designation, emp_id,
          sub_department, location, model, serial_no, processor, ram, hard_disk, os, sub_system,
          supplier, purchase_date, warranty_start, warranty_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

                let successCount = 0;

                db.run("BEGIN TRANSACTION");

                data.forEach((row) => {
                    try {
                        const asset_name = row['Asset Name'];
                        if (!asset_name) return;

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
                    // Clean up uploaded file
                    fs.unlinkSync(req.file.path);
                    res.json({ message: 'success', count: successCount });
                });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing file' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./assets.db');

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_name TEXT,
    asset_type TEXT,
    manufacture TEXT,
    status TEXT,
    department TEXT,
    asset_holder TEXT,
    designation TEXT,
    emp_id TEXT,
    sub_department TEXT,
    location TEXT,
    model TEXT,
    serial_no TEXT,
    processor TEXT,
    ram TEXT,
    hard_disk TEXT,
    os TEXT,
    sub_system TEXT,
    supplier TEXT,
    purchase_date TEXT,
    warranty_start TEXT,
    warranty_end TEXT
  )
`;

const seedData = [
  {
    asset_name: 'ULTS-LAP017',
    asset_type: 'LAPTOP',
    manufacture: 'LENOVO',
    status: 'Scrap',
    department: '',
    asset_holder: '',
    designation: '',
    emp_id: '',
    sub_department: '',
    location: 'ULTS-V-LCP',
    model: 'B40-80 80LS0017IH',
    serial_no: 'MP11WFKD',
    processor: 'i3',
    ram: '4GB',
    hard_disk: '500GB',
    os: 'WINDOWS 8',
    sub_system: '',
    supplier: 'NCTURNS',
    purchase_date: '20-05-2016',
    warranty_start: '21-02-2016',
    warranty_end: '20-02-2017'
  },
  {
    asset_name: 'ULTS-LAP018',
    asset_type: 'LAPTOP',
    manufacture: 'DELL',
    status: 'Active',
    department: 'IT',
    asset_holder: 'John Doe',
    designation: 'Developer',
    emp_id: 'EMP001',
    sub_department: 'Software',
    location: 'HQ-Floor2',
    model: 'Latitude 5400',
    serial_no: 'DL123456',
    processor: 'i7',
    ram: '16GB',
    hard_disk: '512GB SSD',
    os: 'WINDOWS 10',
    sub_system: '',
    supplier: 'DELL DIRECT',
    purchase_date: '01-01-2023',
    warranty_start: '01-01-2023',
    warranty_end: '01-01-2026'
  }
];

db.serialize(() => {
  db.run(createTableQuery);

  db.get("SELECT count(*) as count FROM assets", (err, row) => {
    if (err) {
      console.error(err.message);
      return;
    }
    if (row.count === 0) {
      const stmt = db.prepare(`INSERT INTO assets (
        asset_name, asset_type, manufacture, status, department, asset_holder, designation, emp_id,
        sub_department, location, model, serial_no, processor, ram, hard_disk, os, sub_system,
        supplier, purchase_date, warranty_start, warranty_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

      seedData.forEach(asset => {
        stmt.run(
          asset.asset_name, asset.asset_type, asset.manufacture, asset.status, asset.department,
          asset.asset_holder, asset.designation, asset.emp_id, asset.sub_department, asset.location,
          asset.model, asset.serial_no, asset.processor, asset.ram, asset.hard_disk, asset.os,
          asset.sub_system, asset.supplier, asset.purchase_date, asset.warranty_start, asset.warranty_end
        );
      });
      stmt.finalize();
      console.log('Seeded database with initial data');
    } else {
      console.log('Database already seeded');
    }
  });
});

module.exports = db;

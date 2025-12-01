const db = require('./database');

db.serialize(() => {
    db.get("SELECT count(*) as total FROM assets", (err, row) => {
        console.log('Total assets:', row.total);
    });

    db.get("SELECT count(*) as with_holder FROM assets WHERE asset_holder IS NOT NULL AND asset_holder != ''", (err, row) => {
        console.log('Assets with holder:', row.with_holder);
    });

    db.all("SELECT asset_name, asset_holder FROM assets WHERE asset_holder IS NOT NULL AND asset_holder != '' LIMIT 5", (err, rows) => {
        console.log('Sample with holder:', rows);
    });
});

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './index.css';

function App() {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load data from local storage on mount
    const savedData = localStorage.getItem('assetData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setAssets(parsedData);
        setFilteredAssets(parsedData);
      } catch (e) {
        console.error("Error parsing saved data", e);
      }
    }
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, statusFilter, assets]);

  const filterData = () => {
    let result = assets;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(asset =>
        (asset.asset_name && asset.asset_name.toLowerCase().includes(lowerSearch)) ||
        (asset.serial_no && asset.serial_no.toLowerCase().includes(lowerSearch)) ||
        (asset.emp_id && String(asset.emp_id).toLowerCase().includes(lowerSearch)) ||
        (asset.asset_holder && asset.asset_holder.toLowerCase().includes(lowerSearch)) ||
        (asset.model && asset.model.toLowerCase().includes(lowerSearch))
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(asset => asset.status === statusFilter);
    }

    setFilteredAssets(result);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
  };

  const handleBack = () => {
    setSelectedAsset(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames.length) {
          throw new Error("Excel file is empty or invalid.");
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { range: 2 }); // Start from row 2

        if (!jsonData || jsonData.length === 0) {
          throw new Error("No data found in the Excel sheet (starting from row 3).");
        }

        const processedData = jsonData.map(row => {
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

          return {
            asset_name: row['Asset Name'],
            asset_type: row['Asset Type'],
            manufacture: row['Manufacture'],
            status: row['Status'],
            department: row['Department'],
            asset_holder: row['Asset Holder'],
            designation: row['Designation'],
            emp_id: row['EMP ID'],
            sub_department: row['Sub Department'],
            location: row['Location'],
            model: row['Model'],
            serial_no: row['Serial No.'] || row['Serial No'],
            processor: row['Processor'],
            ram: row['RAM'],
            hard_disk: row['Hard disk'] || row['Hard Disk'],
            os: row['Operating System'] || row['Operating system'],
            sub_system: row['Sub System'],
            supplier: row['Supplier'] || row['__EMPTY_1'],
            purchase_date: formatDate(purchase_date_raw),
            warranty_start: formatDate(warranty_start_raw),
            warranty_end: formatDate(warranty_end_raw)
          };
        }).filter(item => item.asset_name);

        setAssets(processedData);
        localStorage.setItem('assetData', JSON.stringify(processedData));
        alert(`Success! Imported ${processedData.length} assets.`);
      } catch (error) {
        console.error('Error processing file:', error);
        alert(`Error: ${error.message}`);
      } finally {
        setLoading(false);
        e.target.value = null;
      }
    };

    reader.onerror = () => {
      setLoading(false);
      alert("Failed to read the file.");
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="container">
      {selectedAsset ? (
        <DetailView asset={selectedAsset} onBack={handleBack} />
      ) : (
        <>
          <header className="header">
            <div>
              <h1>Asset Manager</h1>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Offline Mode v1.0</small>
            </div>
            <div>
              <input
                type="file"
                id="file-upload"
                style={{ display: 'none' }}
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className="btn-icon"
                title="Upload Report"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </label>
            </div>
          </header>
          <div style={{ marginBottom: '24px', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ flex: 1 }}
            />
            <select
              value={statusFilter}
              onChange={handleStatusChange}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Status</option>
              <option value="Live">Live</option>
              <option value="Stock">Stock</option>
              <option value="Scrap">Scrap</option>
              <option value="FAULTY">Faulty</option>
              <option value="LOST">Lost</option>
              <option value="Not Returned">Not Returned</option>
              <option value="Resigned and Not Returned">Resigned & Not Returned</option>
            </select>
          </div>

          {loading ? (
            <div className="loading">Processing...</div>
          ) : (
            <div className="asset-list">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset, index) => (
                  <AssetCard key={index} asset={asset} onClick={() => handleAssetClick(asset)} />
                ))
              ) : (
                <div className="loading">
                  {assets.length === 0 ? "No data. Upload an Excel file to get started." : "No matching assets found."}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AssetCard({ asset, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div className="card-title" style={{ marginBottom: 0 }}>{asset.asset_name}</div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {asset.asset_holder ? asset.asset_holder : <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>No Holder</span>}
        </div>
      </div>
      <div className="card-subtitle">{asset.model}</div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        <span className="tag">{asset.asset_type}</span>
        <span className="tag" style={{ color: asset.status === 'Active' ? '#4ade80' : '#f87171', backgroundColor: asset.status === 'Active' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)' }}>
          {asset.status}
        </span>
      </div>
    </div>
  );
}

function DetailView({ asset, onBack }) {
  // Filter out internal fields like id if needed, or just show everything
  const fields = [
    { label: 'Asset Name', value: asset.asset_name },
    { label: 'Type', value: asset.asset_type },
    { label: 'Manufacturer', value: asset.manufacture },
    { label: 'Model', value: asset.model },
    { label: 'Serial No', value: asset.serial_no },
    { label: 'Status', value: asset.status },
    { label: 'Location', value: asset.location },
    { label: 'Department', value: asset.department },
    { label: 'Sub Department', value: asset.sub_department },
    { label: 'Asset Holder', value: asset.asset_holder },
    { label: 'Designation', value: asset.designation },
    { label: 'EMP ID', value: asset.emp_id },
    { label: 'Processor', value: asset.processor },
    { label: 'RAM', value: asset.ram },
    { label: 'Hard Disk', value: asset.hard_disk },
    { label: 'OS', value: asset.os },
    { label: 'Supplier', value: asset.supplier },
    { label: 'Purchase Date', value: asset.purchase_date },
    { label: 'Warranty Start', value: asset.warranty_start },
    { label: 'Warranty End', value: asset.warranty_end },
  ];

  return (
    <div className="detail-view">
      <button className="back-btn" onClick={onBack}>
        ← Back to Search
      </button>

      <div className="header">
        <h1>{asset.asset_name}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{asset.model}</p>
      </div>

      <div className="card" style={{ cursor: 'default', transform: 'none' }}>
        {fields.map((field, index) => (
          <div key={index} className="detail-row">
            <span className="detail-label">{field.label}</span>
            <span className="detail-value">{field.value || '-'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

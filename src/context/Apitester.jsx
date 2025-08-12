import React, { useState } from 'react';

const API2Tester = () => {
  const [apiUrl, setApiUrl] = useState('https://jsonplaceholder.typicode.com/posts');
  const [payload, setPayload] = useState({
    userid: '',
    companyid: '',
    usertype: ''
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [method, setMethod] = useState('POST');

  const handleChangePayload = (key, value) => {
    setPayload(prev => ({ ...prev, [key]: value }));
  };

  const addPayloadField = () => {
    const fieldName = prompt('Enter field name:');
    if (fieldName && fieldName.trim() && !payload.hasOwnProperty(fieldName)) {
      setPayload(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const removePayloadField = (key) => {
    if (Object.keys(payload).length > 1) {
      const newPayload = { ...payload };
      delete newPayload[key];
      setPayload(newPayload);
    }
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const fetchData = async () => {
    if (!apiUrl.trim()) {
      setError('API URL is required');
      return;
    }

    if (!validateUrl(apiUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);
    setData([]);

    try {
      const requestOptions = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      // Only add body for POST, PUT, PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        // Filter out empty payload values
        const filteredPayload = Object.fromEntries(
          Object.entries(payload).filter(([_, value]) => value.trim() !== '')
        );
        
        // Actually add the payload to the request body
        if (Object.keys(filteredPayload).length > 0) {
          requestOptions.body = JSON.stringify(filteredPayload);
        }
      }

      const res = await fetch(apiUrl, requestOptions);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON format');
      }

      const json = await res.json();
      
      // Handle different response formats
      let result = json;
      
      // Check if response has a 'd' property with string data (common in some APIs)
      if (json?.d && typeof json.d === 'string') {
        try {
          result = JSON.parse(json.d);
        } catch (parseError) {
          throw new Error('Failed to parse JSON string in response.d property');
        }
      } else if (json?.d) {
        result = json.d;
      } else if (json?.data) {
        result = json.data;
      } else if (json?.results) {
        result = json.results;
      }

      // Ensure result is an array
      if (!Array.isArray(result)) {
        if (typeof result === 'object' && result !== null) {
          result = [result];
        } else {
          throw new Error('API returned unexpected data format');
        }
      }

      if (result.length === 0) {
        setError('No data returned from API');
      } else {
        setData(result);
      }

    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Unable to connect to API. Check URL and CORS settings.');
      } else if (err.name === 'SyntaxError') {
        setError('Invalid JSON response from API');
      } else {
        setError(err.message || 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setData([]);
    setError(null);
  };

  const exportToCSV = () => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        // Handle different data types for CSV export
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setApiUrl('https://jsonplaceholder.typicode.com/posts');
    setPayload({
      userid: '',
      companyid: '',
      usertype: ''
    });
    setMethod('POST');
    setData([]);
    setError(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">🧪 API Tester</h2>
        <button
          onClick={resetForm}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          🔄 Reset Form
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block font-medium mb-2 text-gray-700">🔗 API Endpoint</label>
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://api.example.com/endpoint"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-2 text-gray-700">📡 HTTP Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        {['POST', 'PUT', 'PATCH'].includes(method) && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block font-medium text-gray-700">📦 Request Payload</label>
              <button
                onClick={addPayloadField}
                className="text-sm px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                + Add Field
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(payload).map(([key, val]) => (
                <div key={key} className="relative">
                  <label className="text-sm text-gray-600 block mb-1">{key}</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleChangePayload(key, e.target.value)}
                      className="border border-gray-300 px-3 py-2 flex-1 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Enter ${key}`}
                    />
                    <button
                      onClick={() => removePayloadField(key)}
                      className="px-2 py-2 bg-red-500 text-white rounded-r-lg hover:bg-red-600 transition-colors"
                      title="Remove field"
                      disabled={Object.keys(payload).length === 1}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {Object.keys(payload).length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700 block mb-1">Preview JSON:</label>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                  {JSON.stringify(
                    Object.fromEntries(
                      Object.entries(payload).filter(([_, value]) => value.trim() !== '')
                    ), 
                    null, 
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={fetchData}
            disabled={loading || !apiUrl.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? '⏳ Testing...' : '🔄 Test API'}
          </button>
          
          {(data.length > 0 || error) && (
            <button
              onClick={clearData}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              🗑️ Clear Results
            </button>
          )}
          
          {data.length > 0 && (
            <button
              onClick={exportToCSV}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-blue-800">Loading data...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">❌ {error}</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              📊 API Response Data ({data.length} records)
            </h3>
            <div className="text-sm text-gray-600">
              Scroll horizontally to view all columns
            </div>
          </div>
          
          <div className="overflow-auto max-h-96 border border-gray-200">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700 bg-gray-200">
                    #
                  </th>
                  {Object.keys(data[0]).map((key, index) => (
                    <th key={key} className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap min-w-32 bg-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">({index + 1})</span>
                        <span className="font-medium">{key}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors border-b border-gray-200`}>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-600 bg-gray-50 sticky left-0 z-5">
                      {rowIndex + 1}
                    </td>
                    {Object.entries(row).map(([key, val], colIndex) => (
                      <td key={colIndex} className="border border-gray-300 px-4 py-2 min-w-32">
                        <div className="max-w-xs">
                          {val === null || val === undefined ? (
                            <span className="text-gray-400 italic text-xs bg-gray-100 px-2 py-1 rounded">null</span>
                          ) : typeof val === 'object' ? (
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                                {Array.isArray(val) ? `Array (${val.length})` : 'Object'}
                              </summary>
                              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32 text-gray-700">
                                {JSON.stringify(val, null, 2)}
                              </pre>
                            </details>
                          ) : typeof val === 'boolean' ? (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${val ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {val ? '✓ true' : '✗ false'}
                            </span>
                          ) : typeof val === 'number' ? (
                            <span className="font-mono text-blue-700 font-medium">
                              {val.toLocaleString()}
                            </span>
                          ) : String(val).length > 50 ? (
                            <details className="cursor-pointer">
                              <summary className="text-gray-700 hover:text-gray-900" title={String(val)}>
                                {String(val).substring(0, 50)}...
                              </summary>
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-auto">
                                {String(val)}
                              </div>
                            </details>
                          ) : String(val).startsWith('http') ? (
                            <a 
                              href={String(val)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                              title={String(val)}
                            >
                              {String(val).length > 30 ? String(val).substring(0, 30) + '...' : String(val)}
                            </a>
                          ) : (
                            <span className="text-gray-800" title={String(val)}>
                              {String(val)}
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-600 flex justify-between items-center">
            <span>
              📋 Showing {data.length} records with {Object.keys(data[0] || {}).length} columns
            </span>
            <span className="text-xs">
              💡 Tip: Click on truncated content to expand
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default API2Tester;
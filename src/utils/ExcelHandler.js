import * as XLSX from 'xlsx';

/**
 * ExcelHandler - Utility functions to handle Excel file operations
 */
class ExcelHandler {
  /**
   * Parse Excel file and return array of worksheet data
   */
  static parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellStyles: true,
            cellNF: true
          });
          
          const result = {
            fileName: file.name,
            fileSize: file.size,
            sheets: {}
          };
          
          // Process each sheet
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              header: 1,
              defval: '',
              blankrows: false
            });
            
            // Get headers from first row
            const headers = jsonData[0];
            
            // Convert to object array for easier processing
            const records = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i];
              const record = {};
              
              for (let j = 0; j < headers.length; j++) {
                if (headers[j]) {
                  record[headers[j]] = row[j] !== undefined ? row[j] : '';
                }
              }
              
              records.push(record);
            }
            
            result.sheets[sheetName] = {
              headers: headers,
              data: records,
              rawData: jsonData
            };
          });
          
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading Excel file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * Fetch Excel file from URL
   */
  static fetchExcelFromUrl(url, progressCallback = null) {
    return new Promise(async (resolve, reject) => {
      try {
        // Validate URL
        try {
          new URL(url);
        } catch (err) {
          throw new Error('Invalid URL format');
        }
        
        if (progressCallback) progressCallback(10);
        
        // Fetch the file
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
        }
        
        if (progressCallback) progressCallback(50);
        
        // Get the file as ArrayBuffer
        const data = await response.arrayBuffer();
        
        if (progressCallback) progressCallback(90);
        
        // Check if it's a valid Excel file
        try {
          XLSX.read(data, { type: 'array' });
        } catch (error) {
          throw new Error('The URL does not point to a valid Excel file');
        }
        
        if (progressCallback) progressCallback(100);
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Parse Excel file from URL
   */
  static async parseExcelFromUrl(url, progressCallback = null) {
    try {
      const data = await this.fetchExcelFromUrl(url, progressCallback);
      
      const workbook = XLSX.read(data, {
        type: 'array',
        cellDates: true,
        cellStyles: true,
        cellNF: true
      });
      
      const result = {
        fileName: url.substring(url.lastIndexOf('/') + 1) || 'downloaded-excel.xlsx',
        fileUrl: url,
        sheets: {}
      };
      
      // Process each sheet
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        });
        
        // Get headers from first row
        const headers = jsonData[0];
        
        // Convert to object array for easier processing
        const records = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const record = {};
          
          for (let j = 0; j < headers.length; j++) {
            if (headers[j]) {
              record[headers[j]] = row[j] !== undefined ? row[j] : '';
            }
          }
          
          records.push(record);
        }
        
        result.sheets[sheetName] = {
          headers: headers,
          data: records,
          rawData: jsonData
        };
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Validate Excel file content based on expected headers
   */
  static validateExcelContent(excelData, requiredHeaders, sheetName = null) {
    const result = {
      isValid: true,
      messages: []
    };
    
    // If sheet name specified, only validate that sheet
    const sheetsToValidate = sheetName ? 
      { [sheetName]: excelData.sheets[sheetName] } : 
      excelData.sheets;
    
    // Check if we have the sheets
    if (Object.keys(sheetsToValidate).length === 0) {
      result.isValid = false;
      result.messages.push('No valid worksheets found in the Excel file');
      return result;
    }
    
    // Validate each sheet
    Object.entries(sheetsToValidate).forEach(([name, sheet]) => {
      // Check if sheet has data
      if (!sheet.data || sheet.data.length === 0) {
        result.messages.push(`Sheet "${name}" does not contain any data`);
      }
      
      // Check required headers
      const missingHeaders = requiredHeaders.filter(
        header => !sheet.headers.includes(header)
      );
      
      if (missingHeaders.length > 0) {
        result.isValid = false;
        result.messages.push(
          `Sheet "${name}" is missing required headers: ${missingHeaders.join(', ')}`
        );
      }
    });
    
    return result;
  }
  
  /**
   * Process Excel file for upload to backend
   */
  static prepareExcelForUpload(file, progressCallback = null) {
    return new Promise((resolve, reject) => {
      try {
        // Create FormData
        const formData = new FormData();
        formData.append('files', file);
        
        // Add metadata
        const metadata = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          lastModified: new Date(file.lastModified).toISOString()
        };
        
        formData.append('metadata', JSON.stringify(metadata));
        
        // Call progress callback if provided
        if (progressCallback) {
          progressCallback(100);
        }
        
        resolve(formData);
      } catch (error) {
        reject(new Error(`Failed to prepare Excel for upload: ${error.message}`));
      }
    });
  }

  /**
   * Prepare Excel URL for upload to backend
   */
  static prepareExcelUrlForUpload(url, progressCallback = null) {
    return new Promise((resolve, reject) => {
      try {
        // Validate URL
        try {
          new URL(url);
        } catch (err) {
          throw new Error('Invalid URL format');
        }
        
        if (progressCallback) progressCallback(30);
        
        // Create FormData
        const formData = new FormData();
        formData.append('file_url', url);
        
        // Add metadata
        const metadata = {
          fileUrl: url,
          timestamp: new Date().toISOString()
        };
        
        formData.append('metadata', JSON.stringify(metadata));
        
        if (progressCallback) progressCallback(100);
        
        resolve(formData);
      } catch (error) {
        reject(new Error(`Failed to prepare Excel URL for upload: ${error.message}`));
      }
    });
  }
  
  /**
   * Helper to convert Excel column letter to index
   */
  static excelColToIndex(colStr) {
    let index = 0;
    for (let i = 0; i < colStr.length; i++) {
      index = index * 26 + colStr.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
    }
    return index - 1;
  }
  
  /**
   * Helper to convert index to Excel column letter
   */
  static indexToExcelCol(index) {
    let colStr = '';
    index++;
    
    while (index > 0) {
      const remainder = (index - 1) % 26;
      colStr = String.fromCharCode(65 + remainder) + colStr;
      index = Math.floor((index - remainder) / 26);
    }
    
    return colStr;
  }
}

export default ExcelHandler;
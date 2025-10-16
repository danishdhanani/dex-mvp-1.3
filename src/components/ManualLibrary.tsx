'use client';

import { useState, useEffect } from 'react';

interface Manual {
  id: string;
  title: string;
  filename: string;
  category: string;
  uploadedAt: string;
  size: number;
  tags: string[];
}

interface LibraryStats {
  totalManuals: number;
  totalSize: number;
  categories: string[];
  recentManuals: Manual[];
}

export default function ManualLibrary() {
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'General',
    tags: '',
    file: null as File | null
  });

  useEffect(() => {
    loadManuals();
  }, []);

  const loadManuals = async () => {
    try {
      const response = await fetch('/api/admin/manuals');
      const data = await response.json();
      
      if (response.ok) {
        setManuals(data.manuals || []);
        setStats(data.stats || null);
      } else {
        console.error('Failed to load manuals:', data.error);
      }
    } catch (error) {
      console.error('Error loading manuals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title.trim()) {
      alert('Please select a file and enter a title');
      return;
    }

    // Validate file size (5MB limit)
    if (uploadForm.file.size > 5 * 1024 * 1024) {
      alert('File too large. Please upload files smaller than 5MB.');
      return;
    }

    // Validate file type
    const fileExtension = uploadForm.file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !['txt', 'md', 'pdf'].includes(fileExtension)) {
      alert('Please select a TXT, MD, or PDF file.');
      return;
    }

    setUploading(true);

    try {
      console.log('Starting file upload:', {
        filename: uploadForm.file.name,
        size: uploadForm.file.size,
        type: uploadForm.file.type
      });

      // Read file content based on file type
      let content: string;
      const fileExtension = uploadForm.file.name.split('.').pop()?.toLowerCase();
      
      console.log('File extension:', fileExtension);
      
      if (fileExtension === 'txt' || fileExtension === 'md') {
        // For text files, read as text
        console.log('Processing text file...');
        content = await uploadForm.file.text();
        console.log('Text content length:', content.length);
      } else if (fileExtension === 'pdf') {
        // For PDF files, we'll send the file to the server for text extraction
        // Use FormData for more efficient file transmission
        const formData = new FormData();
        formData.append('pdfFile', uploadForm.file);
        
        // Send to server for PDF text extraction
        console.log('Sending PDF to server...');
        const pdfResponse = await fetch('/api/admin/extract-pdf', {
          method: 'POST',
          body: formData,
        });
        
        console.log('PDF response status:', pdfResponse.status);
        const pdfResult = await pdfResponse.json();
        console.log('PDF result:', pdfResult);
        
        if (!pdfResponse.ok) {
          throw new Error(pdfResult.error || 'Failed to extract text from PDF');
        }
        
        content = pdfResult.text;
        
        if (!content || content.trim().length === 0) {
          throw new Error('Could not extract text from PDF. The PDF might be image-based or corrupted.');
        }
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
      
      // Prepare manual data
      const manualData = {
        title: uploadForm.title.trim(),
        filename: uploadForm.file.name,
        content: content,
        category: uploadForm.category.trim() || 'General',
        tags: uploadForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      // Upload to server
      const response = await fetch('/api/admin/manuals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Reset form and reload manuals
      setUploadForm({
        title: '',
        category: 'General',
        tags: '',
        file: null
      });
      setShowUploadForm(false);
      
      await loadManuals();
      alert('Manual uploaded successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      alert('Failed to upload manual: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const deleteManual = async (manualId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/manuals?id=${manualId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Delete failed');
      }

      await loadManuals();
      alert('Manual deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete manual: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading manual library...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-600 rounded-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">{stats.totalManuals}</p>
                <p className="text-gray-400">Total Manuals</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-600 rounded-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">{formatFileSize(stats.totalSize)}</p>
                <p className="text-gray-400">Total Size</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-600 rounded-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">{stats.categories.length}</p>
                <p className="text-gray-400">Categories</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Upload New Manual</h3>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showUploadForm ? 'Cancel' : 'Upload Manual'}
          </button>
        </div>

        {showUploadForm && (
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Manual Title *
                </label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Enter manual title"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General">General</option>
                  <option value="HVAC Systems">HVAC Systems</option>
                  <option value="Ice Machines">Ice Machines</option>
                  <option value="Refrigeration">Refrigeration</option>
                  <option value="Troubleshooting">Troubleshooting</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Installation">Installation</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                placeholder="hvac, troubleshooting, repair"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                File *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".txt,.md,.pdf"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="w-full px-4 py-3 bg-gray-600 hover:bg-gray-500 border-2 border-dashed border-gray-500 hover:border-gray-400 rounded-lg text-center transition-colors cursor-pointer">
                  <div className="flex items-center justify-center space-x-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                    <span className="text-gray-200 font-medium">
                      {uploadForm.file ? uploadForm.file.name : 'Choose File to Upload'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Supported formats: TXT, MD, PDF (max 5MB)
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={uploading || !uploadForm.file || !uploadForm.title.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Manual'}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Manuals List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Manual Library</h3>
        
        {manuals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
            </div>
            <p className="text-gray-400 text-lg mb-2">No manuals uploaded yet</p>
            <p className="text-gray-500">Upload your first HVAC/R manual to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {manuals.map((manual) => (
              <div
                key={manual.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-white truncate">{manual.title}</h4>
                    <p className="text-gray-400 text-sm mb-2">{manual.filename}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                          <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5a2 2 0 0 0-2-2z"/>
                          <path d="M8 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"/>
                        </svg>
                        {manual.category}
                      </span>
                      <span className="flex items-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                        {formatFileSize(manual.size)}
                      </span>
                      <span className="flex items-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {formatDate(manual.uploadedAt)}
                      </span>
                    </div>
                    
                    {manual.tags.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {manual.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => deleteManual(manual.id, manual.title)}
                    className="ml-4 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete manual"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

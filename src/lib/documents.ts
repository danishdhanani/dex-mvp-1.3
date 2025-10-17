// Document service that uses the manual library
import { manualLibrary } from './manual-library';

export class DocumentService {
  constructor() {
    console.log('Document service initialized with manual library');
  }

  async getRelevantContent(query: string, maxLength: number = 1500): Promise<string> {
    return await manualLibrary.getRelevantContent(query, maxLength);
  }

  async getUnitSpecificContent(query: string, unitInfo: any, maxLength: number = 1500): Promise<string> {
    return await manualLibrary.getUnitSpecificContent(query, unitInfo, maxLength);
  }

  async getAllDocuments() {
    const manuals = await manualLibrary.getAllManuals();
    return manuals.map(manual => ({
      id: manual.id,
      filename: manual.filename,
      title: manual.title,
      category: manual.category,
      uploadedAt: manual.uploadedAt,
      size: manual.size,
      tags: manual.tags
    }));
  }

  async getDocument(id: string) {
    return await manualLibrary.getManual(id);
  }

  async searchDocuments(query: string) {
    return await manualLibrary.searchManuals(query);
  }

  async getLibraryStats() {
    return await manualLibrary.getLibraryStats();
  }
}

export const documentService = new DocumentService();

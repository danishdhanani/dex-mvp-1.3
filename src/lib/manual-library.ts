// Persistent manual library system
import fs from 'fs';
import path from 'path';

export interface Manual {
  id: string;
  title: string;
  filename: string;
  content: string;
  category: string;
  uploadedAt: Date;
  size: number;
  tags: string[];
  // Unit information for targeted troubleshooting
  unitInfo: {
    brand: string;           // e.g., "Hoshizaki", "Manitowoc", "Scotsman"
    model: string;           // e.g., "KM-1200 SRE", "iT1200 Indigo"
    series?: string;         // e.g., "SRE Series", "Indigo Series"
    yearRange?: string;      // e.g., "2020-2024", "2018+"
    unitType: string;        // e.g., "Ice Machine", "Refrigerator", "Freezer"
  };
}

export class ManualLibrary {
  private libraryDir: string;
  private libraryFile: string;

  constructor() {
    this.libraryDir = path.join(process.cwd(), 'manual-library');
    this.libraryFile = path.join(this.libraryDir, 'manuals.json');
    this.ensureLibraryDir();
  }

  private ensureLibraryDir() {
    try {
      if (!fs.existsSync(this.libraryDir)) {
        fs.mkdirSync(this.libraryDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating manual library directory:', error);
    }
  }

  private loadManuals(): Manual[] {
    try {
      if (!fs.existsSync(this.libraryFile)) {
        return [];
      }
      const data = fs.readFileSync(this.libraryFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading manuals:', error);
      return [];
    }
  }

  private saveManuals(manuals: Manual[]): void {
    try {
      fs.writeFileSync(this.libraryFile, JSON.stringify(manuals, null, 2));
    } catch (error) {
      console.error('Error saving manuals:', error);
      throw new Error('Failed to save manual library');
    }
  }

  async addManual(
    title: string,
    filename: string,
    content: string,
    category: string = 'General',
    tags: string[] = [],
    unitInfo: {
      brand: string;
      model: string;
      series?: string;
      yearRange?: string;
      unitType: string;
    }
  ): Promise<string> {
    // Validate content size (5MB limit)
    if (content.length > 5 * 1024 * 1024) {
      throw new Error('Manual content too large. Maximum size is 5MB.');
    }
    const id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    
    const manual: Manual = {
      id,
      title,
      filename,
      content,
      category,
      uploadedAt: new Date(),
      size: content.length,
      tags,
      unitInfo
    };

    const manuals = this.loadManuals();
    manuals.push(manual);
    this.saveManuals(manuals);

    console.log(`Manual added: ${title} (${id})`);
    return id;
  }

  async getAllManuals(): Promise<Manual[]> {
    return this.loadManuals();
  }

  async getManual(id: string): Promise<Manual | null> {
    const manuals = this.loadManuals();
    return manuals.find(manual => manual.id === id) || null;
  }

  async searchManuals(query: string): Promise<Manual[]> {
    const manuals = this.loadManuals();
    const searchTerms = query.toLowerCase().split(' ');
    
    return manuals.filter(manual => {
      const searchableText = `${manual.title} ${manual.content} ${manual.category} ${manual.tags.join(' ')}`.toLowerCase();
      return searchTerms.some(term => searchableText.includes(term));
    });
  }

  async getRelevantContent(query: string, maxLength: number = 1500): Promise<string> {
    const relevantManuals = await this.searchManuals(query);
    
    if (relevantManuals.length === 0) {
      return 'No relevant manuals found in the library.';
    }

    let content = '';
    const searchTerms = query.toLowerCase().split(' ');
    
    for (const manual of relevantManuals.slice(0, 2)) { // Limit to top 2 manuals
      // Extract relevant snippets
      const lines = manual.content.split('\n');
      const relevantLines: string[] = [];
      
      // Find lines that contain search terms
      for (const line of lines) {
        if (searchTerms.some(term => line.toLowerCase().includes(term))) {
          relevantLines.push(line.trim());
          if (relevantLines.length >= 5) break; // Limit to 5 relevant lines per manual
        }
      }
      
      if (relevantLines.length > 0) {
        content += `\n\n--- ${manual.title} ---\n${relevantLines.join('\n')}`;
        if (content.length > maxLength) {
          content = content.substring(0, maxLength) + '...';
          break;
        }
      }
    }

    return content || 'No relevant content found in the manual library.';
  }

  // Search manuals by unit information
  async searchManualsByUnit(unitInfo: {
    brand?: string;
    model?: string;
    series?: string;
    unitType?: string;
  }): Promise<Manual[]> {
    const manuals = this.loadManuals();
    
    return manuals.filter(manual => {
      // If no unit info provided, return all manuals
      if (!unitInfo.brand && !unitInfo.model && !unitInfo.series && !unitInfo.unitType) {
        return true;
      }
      
      const manualUnit = manual.unitInfo;
      
      // Check brand match (case insensitive)
      if (unitInfo.brand && !manualUnit.brand.toLowerCase().includes(unitInfo.brand.toLowerCase())) {
        return false;
      }
      
      // Check model match (case insensitive, partial match)
      if (unitInfo.model && !manualUnit.model.toLowerCase().includes(unitInfo.model.toLowerCase())) {
        return false;
      }
      
      // Check series match (case insensitive, partial match)
      if (unitInfo.series && manualUnit.series && !manualUnit.series.toLowerCase().includes(unitInfo.series.toLowerCase())) {
        return false;
      }
      
      // Check unit type match (case insensitive)
      if (unitInfo.unitType && !manualUnit.unitType.toLowerCase().includes(unitInfo.unitType.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }

  // Get unit-based content for AI context
  async getUnitSpecificContent(
    query: string, 
    unitInfo: {
      brand?: string;
      model?: string;
      series?: string;
      unitType?: string;
    },
    maxLength: number = 1500
  ): Promise<string> {
    // First get unit-specific manuals
    const unitManuals = await this.searchManualsByUnit(unitInfo);
    
    if (unitManuals.length === 0) {
      return 'No manuals found for the specified unit. Please check the unit information or upload relevant manuals.';
    }

    // Then search within those manuals for relevant content
    const searchTerms = query.toLowerCase().split(' ');
    let content = '';
    
    for (const manual of unitManuals.slice(0, 2)) { // Limit to top 2 unit-specific manuals
      const lines = manual.content.split('\n');
      const relevantLines: string[] = [];
      
      // Find lines that contain search terms
      for (const line of lines) {
        if (searchTerms.some(term => line.toLowerCase().includes(term))) {
          relevantLines.push(line.trim());
          if (relevantLines.length >= 5) break; // Limit to 5 relevant lines per manual
        }
      }
      
      if (relevantLines.length > 0) {
        content += `\n\n--- ${manual.title} (${manual.unitInfo.brand} ${manual.unitInfo.model}) ---\n${relevantLines.join('\n')}`;
        if (content.length > maxLength) {
          content = content.substring(0, maxLength) + '...';
          break;
        }
      }
    }

    return content || `No relevant content found in the ${unitInfo.brand || 'specified unit'} manuals.`;
  }

  async deleteManual(id: string): Promise<boolean> {
    const manuals = this.loadManuals();
    const initialLength = manuals.length;
    const filteredManuals = manuals.filter(manual => manual.id !== id);
    
    if (filteredManuals.length === initialLength) {
      return false; // Manual not found
    }
    
    this.saveManuals(filteredManuals);
    console.log(`Manual deleted: ${id}`);
    return true;
  }

  async updateManualMetadata(
    id: string,
    title: string,
    category: string,
    tags: string[],
    unitInfo: {
      brand: string;
      model: string;
      series?: string;
      yearRange?: string;
      unitType: string;
    }
  ): Promise<boolean> {
    const manuals = this.loadManuals();
    const manualIndex = manuals.findIndex(manual => manual.id === id);
    
    if (manualIndex === -1) {
      return false; // Manual not found
    }
    
    // Update the manual's metadata
    manuals[manualIndex] = {
      ...manuals[manualIndex],
      title,
      category,
      tags,
      unitInfo
    };
    
    this.saveManuals(manuals);
    console.log(`Manual metadata updated: ${id}`);
    return true;
  }

  async getLibraryStats(): Promise<{
    totalManuals: number;
    totalSize: number;
    categories: string[];
    recentManuals: Manual[];
  }> {
    const manuals = this.loadManuals();
    
    return {
      totalManuals: manuals.length,
      totalSize: manuals.reduce((sum, manual) => sum + manual.size, 0),
      categories: [...new Set(manuals.map(manual => manual.category))],
      recentManuals: manuals
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
        .slice(0, 5)
    };
  }
}

export const manualLibrary = new ManualLibrary();

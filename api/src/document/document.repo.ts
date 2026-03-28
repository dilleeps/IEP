import { IepDocument } from './document.model.js';
import { IepAnalysis } from './analysis.model.js';
import { BaseRepo } from '../shared/db/base.repo.js';

export class DocumentRepository extends BaseRepo<IepDocument> {
  constructor() {
    super(IepDocument);
  }

  async findByUserId(userId: string, filters?: {
    childId?: string;
    documentType?: string;
    status?: string;
  }): Promise<IepDocument[]> {
    const where: any = { userId };
    
    if (filters?.childId) where.childId = filters.childId;
    if (filters?.documentType) where.documentType = filters.documentType;
    if (filters?.status) where.status = filters.status;

    return this.model.findAll({
      where,
      order: [['uploadDate', 'DESC']],
      include: [{
        model: IepAnalysis,
        as: 'analysis',
        required: false,
      }],
    });
  }

  async findByChildId(childId: string): Promise<IepDocument[]> {
    return this.model.findAll({
      where: { childId },
      order: [['uploadDate', 'DESC']],
      include: [{
        model: IepAnalysis,
        as: 'analysis',
        required: false,
      }],
    });
  }

  async findByChildAndHash(childId: string, fileHash: string): Promise<IepDocument | null> {
    return this.model.findOne({
      where: { 
        childId, 
        fileHash,
        deletedAt: null, // Only check non-deleted documents
      },
    });
  }

  async update(id: string, data: any): Promise<IepDocument> {
    await this.model.update(data, { where: { id } });
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Document not found after update');
    }
    return updated;
  }

  async softDelete(id: string): Promise<void> {
    await this.model.destroy({ where: { id } });
  }

  async updateStatus(id: string, status: string, analysisStatus?: string): Promise<void> {
    const updates: any = { status };
    if (analysisStatus) updates.analysisStatus = analysisStatus;
    await this.model.update(updates, { where: { id } });
  }
}

export class AnalysisRepository extends BaseRepo<IepAnalysis> {
  constructor() {
    super(IepAnalysis);
  }

  async findByDocumentId(documentId: string): Promise<IepAnalysis | null> {
    return this.model.findOne({ where: { documentId } });
  }

  async createAnalysis(data: any): Promise<IepAnalysis> {
    return this.model.create(data);
  }
}

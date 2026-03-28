// src/modules/resource/resource.types.ts

export interface CreateResourceDto {
  title: string;
  description: string;
  category: 'legal' | 'educational' | 'medical' | 'advocacy' | 'support' | 'financial' | 'technology' | 'other';
  resourceType: 'article' | 'video' | 'pdf' | 'link' | 'contact' | 'organization' | 'tool' | 'other';
  url?: string;
  content?: string;
  tags?: string[];
  targetAudience?: string[];
  state?: string;
}

export interface UpdateResourceDto {
  title?: string;
  description?: string;
  category?: 'legal' | 'educational' | 'medical' | 'advocacy' | 'support' | 'financial' | 'technology' | 'other';
  resourceType?: 'article' | 'video' | 'pdf' | 'link' | 'contact' | 'organization' | 'tool' | 'other';
  url?: string;
  content?: string;
  tags?: string[];
  targetAudience?: string[];
  state?: string;
  isActive?: boolean;
}

export interface ResourceResponse {
  id: string;
  title: string;
  description: string;
  category: string;
  resourceType: string;
  url?: string;
  content?: string;
  tags: string[];
  targetAudience: string[];
  state?: string;
  isActive: boolean;
  viewCount: number;
  rating?: number;
  createdAt: string;
}

export interface ResourceFiltersDto {
  category?: string;
  resourceType?: string;
  tags?: string[];
  state?: string;
  targetAudience?: string[];
  search?: string;
}

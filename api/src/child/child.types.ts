export interface CreateChildDto {
  name: string;
  dateOfBirth?: Date;
  age?: number;
  grade?: string;
  schoolName?: string;
  schoolDistrict?: string;
  country?: string;
  homeAddress?: string;
  phoneNumber?: string;
  disabilities?: string[];
  focusTags?: string[];
  advocacyLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  advocacyBio?: string;
  primaryGoal?: string;
  stateContext?: string;
  accommodationsSummary?: string;
  servicesSummary?: string;
  reminderPreferences?: Record<string, any>;
}

export interface UpdateChildDto extends Partial<CreateChildDto> {}

export interface ChildResponse {
  id: string;
  name: string;
  age?: number;
  grade?: string;
  schoolName?: string;
  schoolDistrict?: string;
  country?: string;
  homeAddress?: string;
  phoneNumber?: string;
  disabilities: string[];
  focusTags: string[];
  lastIepDate?: string;
  nextIepReviewDate?: string;
  advocacyLevel?: string;
  primaryGoal?: string;
  stateContext?: string;
  accommodationsSummary?: string;
  servicesSummary?: string;
  isActive: boolean;
  createdAt: string;
}

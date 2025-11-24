import { createClient } from '@/lib/supabase/client';
import type { ServiceCallChecklist } from '@/app/service-call/checklist/types';

export interface ServiceCallChecklistData {
  sections: any[];
  readings: {
    gasPressure: string;
    tempRise: string;
    blowerAmps: string;
    additionalRepairs: string;
    boxTemp: string;
    setpoint: string;
  };
  wrapUpNotes: string;
  chosenWrapUp: boolean;
  blockingMessageResolutions: Record<string, 'resolved' | 'acknowledged'>;
  customIssueDescription: string;
  hypotheses: any[];
  chosenPathTitles: string[];
  currentSection: number;
}

export interface PMChecklistData {
  sections: any[];
  readings: {
    gasPressure: string;
    tempRise: string;
    blowerAmps: string;
    additionalRepairs: string;
  };
  currentSection: number;
}

/**
 * Save a service call checklist to the database
 */
export async function saveServiceCallChecklist(
  unitType: string,
  issueId: string,
  data: ServiceCallChecklistData
): Promise<{ id: number } | null> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to save checklists');
  }

  // Get user's org_id from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user org_id:', userError);
    // Continue without org_id if there's an error
  }

  // Check if a checklist already exists for this user/unit/issue combination
  // Query by checking details JSONB for unitType and issueId
  const { data: existing } = await supabase
    .from('service_calls')
    .select('id')
    .eq('user_id', user.id)
    .eq('details->>unitType', unitType)
    .eq('details->>issueId', issueId)
    .maybeSingle();

  // Store everything in the details JSONB column
  const details = {
    unitType,
    issueId,
    sections: data.sections,
    readings: data.readings,
    wrapUpNotes: data.wrapUpNotes || '',
    chosenWrapUp: data.chosenWrapUp || false,
    blockingMessageResolutions: data.blockingMessageResolutions || {},
    customIssueDescription: data.customIssueDescription || '',
    hypotheses: data.hypotheses || [],
    chosenPathTitles: data.chosenPathTitles || [],
    currentSection: data.currentSection || 1,
  };

  const record = {
    user_id: user.id,
    org_id: userData?.org_id || null,
    details,
  };

  if (existing) {
    // Update existing record
    const { data: updated, error } = await supabase
      .from('service_calls')
      .update(record)
      .eq('id', existing.id)
      .select('id')
      .single();

    if (error) {
      console.error('Error updating checklist:', error);
      throw error;
    }

    return updated;
  } else {
    // Insert new record
    const { data: inserted, error } = await supabase
      .from('service_calls')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      console.error('Error saving checklist:', error);
      throw error;
    }

    return inserted;
  }
}

/**
 * Load a service call checklist from the database
 */
export async function loadServiceCallChecklist(
  unitType: string,
  issueId: string
): Promise<ServiceCallChecklistData | null> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('service_calls')
    .select('details')
    .eq('user_id', user.id)
    .eq('details->>unitType', unitType)
    .eq('details->>issueId', issueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error loading checklist:', error);
    return null;
  }

  if (!data || !data.details) {
    return null;
  }

  // Extract all data from the details JSONB column
  const checklistData = data.details;
  
  return {
    sections: checklistData.sections || [],
    readings: checklistData.readings || {
      gasPressure: '',
      tempRise: '',
      blowerAmps: '',
      additionalRepairs: '',
      boxTemp: '',
      setpoint: '',
    },
    wrapUpNotes: checklistData.wrapUpNotes || '',
    chosenWrapUp: checklistData.chosenWrapUp || false,
    blockingMessageResolutions: checklistData.blockingMessageResolutions || {},
    customIssueDescription: checklistData.customIssueDescription || '',
    hypotheses: checklistData.hypotheses || [],
    chosenPathTitles: checklistData.chosenPathTitles || [],
    currentSection: checklistData.currentSection || 1,
  };
}

/**
 * Save a PM checklist to the database
 */
export async function savePMChecklist(
  unitId: string,
  data: PMChecklistData
): Promise<{ id: number } | null> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User must be authenticated to save checklists');
  }

  // Get user's org_id from users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('Error fetching user org_id:', userError);
    // Continue without org_id if there's an error
  }

  // Check if a checklist already exists for this user/unit combination
  // Query by checking details JSONB for unitId
  const { data: existing } = await supabase
    .from('preventive_maintenance')
    .select('id')
    .eq('user_id', user.id)
    .eq('details->>unitId', unitId)
    .maybeSingle();

  // Store everything in the details JSONB column
  const details = {
    unitId,
    sections: data.sections,
    readings: data.readings,
    currentSection: data.currentSection || 1,
  };

  const record = {
    user_id: user.id,
    org_id: userData?.org_id || null,
    details,
  };

  if (existing) {
    // Update existing record
    const { data: updated, error } = await supabase
      .from('preventive_maintenance')
      .update(record)
      .eq('id', existing.id)
      .select('id')
      .single();

    if (error) {
      console.error('Error updating PM checklist:', error);
      throw error;
    }

    return updated;
  } else {
    // Insert new record
    const { data: inserted, error } = await supabase
      .from('preventive_maintenance')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      console.error('Error saving PM checklist:', error);
      throw error;
    }

    return inserted;
  }
}

/**
 * Load a PM checklist from the database
 */
export async function loadPMChecklist(
  unitId: string
): Promise<PMChecklistData | null> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('preventive_maintenance')
    .select('details')
    .eq('user_id', user.id)
    .eq('details->>unitId', unitId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error loading PM checklist:', error);
    return null;
  }

  if (!data || !data.details) {
    return null;
  }

  // Extract all data from the details JSONB column
  const checklistData = data.details;
  
  return {
    sections: checklistData.sections || [],
    readings: checklistData.readings || {
      gasPressure: '',
      tempRise: '',
      blowerAmps: '',
      additionalRepairs: '',
    },
    currentSection: checklistData.currentSection || 1,
  };
}


import { supabase } from '../lib/supabase';
import type { SlotWithVolunteers } from '../types/slot';
import type { Position } from '../types/position';

export interface SlotValidationResult {
  isValid: boolean;
  error?: string;
}

async function checkSlotOverlap(
  startTime: string,
  endTime: string,
  positionId: string,
  slotId?: string
): Promise<boolean> {
  const query = supabase
    .from('position_slots')
    .select('id, start_time, end_time')
    .eq('position_id', positionId)
    .not('start_time', 'is', null)
    .not('end_time', 'is', null);

  // Exclude current slot when editing
  if (slotId) {
    query.neq('id', slotId);
  }

  const { data: existingSlots, error } = await query;
  
  if (error) {
    throw new Error('Failed to check slot overlap');
  }

  const newStart = new Date(startTime);
  const newEnd = new Date(endTime);

  return existingSlots.some(slot => {
    const slotStart = new Date(slot.start_time);
    const slotEnd = new Date(slot.end_time);

    // Check if the new slot overlaps with any existing slot
    return (
      (newStart >= slotStart && newStart < slotEnd) || // New start is within existing slot
      (newEnd > slotStart && newEnd <= slotEnd) || // New end is within existing slot
      (newStart <= slotStart && newEnd >= slotEnd) // New slot completely contains existing slot
    );
  });
}

export async function validateSlot(
  startTime: string,
  endTime: string,
  position: Position,
  currentSlotId?: string
): Promise<SlotValidationResult> {
  // Basic time validation
  const start = new Date(startTime);
  const end = new Date(endTime);
  const positionStart = new Date(position.start_time);
  const positionEnd = new Date(position.end_time);

  if (start < positionStart) {
    return {
      isValid: false,
      error: `Start time must be after position start time (${positionStart.toLocaleString()})`
    };
  }

  if (end > positionEnd) {
    return {
      isValid: false,
      error: `End time must be before position end time (${positionEnd.toLocaleString()})`
    };
  }

  if (end <= start) {
    return {
      isValid: false,
      error: 'End time must be after start time'
    };
  }

  // Check for overlaps with existing slots
  try {
    const hasOverlap = await checkSlotOverlap(startTime, endTime, position.id, currentSlotId);
    if (hasOverlap) {
      return {
        isValid: false,
        error: 'This time slot overlaps with an existing slot'
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to validate slot time overlap'
    };
  }

  return { isValid: true };
}
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useVolunteerStore } from '../store/volunteerStore';
import type { SlotWithVolunteers } from '../types/slot';

export function useCheckIn(positionId: string | undefined, slotId: string | null) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotWithVolunteers | null>(null);
  const { checkIn } = useVolunteerStore();

  useEffect(() => {
    async function fetchSlotDetails() {
      setLoading(true);
      setError(null);

      try {
        if (!positionId) {
          setError('Position ID is required');
          return;
        }

        let query = supabase
          .from('slot_details')
          .select('*');

        if (slotId) {
          // If slot ID is provided, get that specific slot
          query = query.eq('id', slotId);
        } else {
          // Otherwise, get current active slot for the position
          const now = new Date().toISOString();
          query = query
            .eq('position_id', positionId)
            .lte('start_time', now)
            .gte('end_time', now);
        }

        const { data, error: slotError } = await query.maybeSingle();

        if (slotError) throw slotError;
        if (!data) throw new Error('No active time slot found for check-in');

        setSlot(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load slot details');
      } finally {
        setLoading(false);
      }
    }

    fetchSlotDetails();
  }, [positionId, slotId]);

  const handleCheckIn = async (email: string, name: string) => {
    if (!slot) {
      throw new Error('No slot selected');
    }

    await checkIn(slot.id, name, email);
  };

  return {
    slot,
    loading,
    error,
    handleCheckIn
  };
}
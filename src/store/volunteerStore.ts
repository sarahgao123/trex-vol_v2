import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface VolunteerState {
  loading: boolean;
  error: string | null;
  checkIn: (slotId: string, name: string, email: string) => Promise<void>;
}

export const useVolunteerStore = create<VolunteerState>((set) => ({
  loading: false,
  error: null,

  checkIn: async (slotId: string, name: string, email: string) => {
    set({ loading: true, error: null });
    try {
      // First verify the slot exists and is active
      const { data: slotData, error: slotError } = await supabase
        .from('slot_details')
        .select('*')
        .eq('id', slotId)
        .single();

      if (slotError) throw new Error('Invalid slot');

      // Check if the volunteer is registered for this slot
      const { data: volunteers } = await supabase
        .from('volunteers')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!volunteers) {
        throw new Error('No registration found for this email address');
      }

      // Verify slot assignment
      const { data: slotVolunteer, error: verifyError } = await supabase
        .from('slot_volunteers')
        .select('checked_in')
        .eq('slot_id', slotId)
        .eq('volunteer_id', volunteers.id)
        .single();

      if (verifyError || !slotVolunteer) {
        throw new Error('No registration found for this email address');
      }

      if (slotVolunteer.checked_in) {
        throw new Error('You have already checked in for this slot');
      }

      // Update check-in status
      const { error: updateError } = await supabase
        .from('slot_volunteers')
        .update({ 
          checked_in: true,
          check_in_time: new Date().toISOString()
        })
        .eq('slot_id', slotId)
        .eq('volunteer_id', volunteers.id);

      if (updateError) throw updateError;

      // Update volunteer name if provided
      if (name) {
        const { error: nameError } = await supabase
          .from('volunteers')
          .update({ name })
          .eq('id', volunteers.id);

        if (nameError) throw nameError;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ loading: false });
    }
  },
}));
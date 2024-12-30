import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useCheckIn } from '../hooks/useCheckIn';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { formatDateTime } from '../utils/dateFormat';

interface CheckInFormData {
  email: string;
  name: string;
}

export function CheckInPage() {
  const navigate = useNavigate();
  const { positionId } = useParams<{ positionId: string }>();
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get('slot');
  
  const { slot, loading, error, handleCheckIn } = useCheckIn(positionId, slotId);
  const [formData, setFormData] = useState<CheckInFormData>({ email: '', name: '' });
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <ErrorMessage message={error} />
          <button
            onClick={handleCancel}
            className="mt-4 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <ErrorMessage message="No active time slot found for check-in" />
          <button
            onClick={handleCancel}
            className="mt-4 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Filter out already checked-in volunteers
  const availableVolunteers = slot.volunteers.filter(v => !v.checked_in);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name) return;

    try {
      await handleCheckIn(formData.email, formData.name);
      setCheckInStatus('success');
      setStatusMessage('Successfully checked in! Thank you for volunteering.');
    } catch (err) {
      setCheckInStatus('error');
      setStatusMessage(err instanceof Error ? err.message : 'Failed to check in');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Volunteer Check-in</h2>
          {slot.start_time && slot.end_time && (
            <p className="mt-2 text-sm text-gray-600">
              Scheduled Time: {formatDateTime(slot.start_time)} - {formatDateTime(slot.end_time)}
            </p>
          )}
        </div>

        {checkInStatus === 'idle' ? (
          <>
            {availableVolunteers.length === 0 ? (
              <div className="text-center text-gray-600">
                <p className="mb-4">All volunteers have been checked in for this slot.</p>
                <button
                  onClick={handleCancel}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Select Your Email
                  </label>
                  <select
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      const volunteer = slot.volunteers.find(v => v.user.email === e.target.value);
                      setFormData({
                        email: e.target.value,
                        name: volunteer?.name || ''
                      });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select your email</option>
                    {availableVolunteers.map(v => (
                      <option key={v.user.id} value={v.user.email}>
                        {v.user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!formData.email || !formData.name}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Check In
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className={`text-center p-4 rounded-md ${
              checkInStatus === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {statusMessage}
            </div>
            <button
              onClick={handleCancel}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
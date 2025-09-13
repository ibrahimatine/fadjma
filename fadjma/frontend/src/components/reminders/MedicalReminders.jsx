import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MedicalReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await api.get('/nft/reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('Erreur récupération rappels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReminderIcon = (type) => {
    switch (type) {
      case 'VACCINATION':
        return '💉';
      case 'CHECKUP':
        return '🏥';
      case 'MEDICATION':
        return '💊';
      default:
        return '📅';
    }
  };

  const getReminderColor = (scheduledDate) => {
    const daysUntil = Math.ceil((new Date(scheduledDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return 'bg-red-50 border-red-200';
    if (daysUntil <= 7) return 'bg-orange-50 border-orange-200';
    return 'bg-blue-50 border-blue-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          Rappels Médicaux
        </h3>
        <span className="text-sm text-gray-500">
          Programmés sur Hedera
        </span>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucun rappel programmé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const daysUntil = Math.ceil(
              (new Date(reminder.scheduledDate) - new Date()) / (1000 * 60 * 60 * 24)
            );
            
            return (
              <div
                key={reminder.id}
                className={`p-4 rounded-lg border ${getReminderColor(reminder.scheduledDate)} transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getReminderIcon(reminder.type)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{reminder.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(reminder.scheduledDate), 'dd MMM yyyy', { locale: fr })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {daysUntil > 0 ? `Dans ${daysUntil} jours` : 
                         daysUntil === 0 ? "Aujourd'hui" : "En retard"}
                      </span>
                    </div>
                    {reminder.hederaScheduleId && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Schedule ID: {reminder.hederaScheduleId}
                      </div>
                    )}
                  </div>
                  {reminder.status === 'SENT' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {daysUntil <= 7 && daysUntil >= 0 && (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer avec info Hedera */}
      <div className="mt-6 pt-4 border-t text-center">
        <p className="text-xs text-gray-500">
          Rappels programmés via Hedera Scheduled Transactions
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Immuables • Décentralisés • Automatiques
        </p>
      </div>
    </div>
  );
};

export default MedicalReminders;
class ReminderService {
  constructor() {
    this.reminders = new Map(); // Stockage temporaire des rappels
  }

  async scheduleVaccinationReminder(patientId, vaccinationData) {
    try {
      const nextDoseDate = new Date(vaccinationData.nextDose);
      const reminderDate = new Date(nextDoseDate);
      reminderDate.setDate(reminderDate.getDate() - 7); // Rappel 7 jours avant

      // En production : Utiliser ScheduleCreateTransaction de Hedera
      // const scheduleTx = await new ScheduleCreateTransaction()
      //   .setScheduledTransaction(
      //     new TopicMessageSubmitTransaction()
      //       .setTopicId(remindersTopicId)
      //       .setMessage(JSON.stringify(reminderData))
      //   )
      //   .setExpirationTime(reminderDate)
      //   .execute(hederaClient.client);

      // Pour la démo : Créer un rappel local
      const reminder = {
        id: `REM-${Date.now()}`,
        patientId,
        type: 'VACCINATION',
        message: `Rappel: Prochaine dose de ${vaccinationData.vaccine} prévue le ${nextDoseDate.toLocaleDateString('fr-FR')}`,
        scheduledDate: reminderDate,
        status: 'SCHEDULED',
        hederaScheduleId: `0.0.${Math.floor(Math.random() * 1000000)}`,
        createdAt: new Date()
      };

      // Stocker le rappel
      this.reminders.set(reminder.id, reminder);

      // Simuler l'envoi après un délai (pour la démo)
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          this.sendReminder(reminder);
        }, 10000); // Envoyer après 10 secondes pour la démo
      }

      console.log('✅ Rappel programmé:', reminder.id);
      return reminder;
      
    } catch (error) {
      console.error('Erreur programmation rappel:', error);
      throw error;
    }
  }

  async scheduleCheckupReminder(patientId, checkupData) {
    const reminder = {
      id: `CHK-${Date.now()}`,
      patientId,
      type: 'CHECKUP',
      message: `Rappel: Bilan de santé annuel recommandé`,
      scheduledDate: new Date(checkupData.nextDate),
      status: 'SCHEDULED',
      hederaScheduleId: `0.0.${Math.floor(Math.random() * 1000000)}`
    };

    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  async getPatientReminders(patientId) {
    const patientReminders = [];
    for (const [id, reminder] of this.reminders) {
      if (reminder.patientId === patientId) {
        patientReminders.push(reminder);
      }
    }
    return patientReminders.sort((a, b) => 
      new Date(a.scheduledDate) - new Date(b.scheduledDate)
    );
  }

  sendReminder(reminder) {
    // Simuler l'envoi d'une notification
    console.log(`📧 Rappel envoyé: ${reminder.message}`);
    reminder.status = 'SENT';
    reminder.sentAt = new Date();
  }

  async cancelReminder(reminderId) {
    const reminder = this.reminders.get(reminderId);
    if (reminder) {
      reminder.status = 'CANCELLED';
      return { success: true, reminder };
    }
    return { success: false, message: 'Rappel non trouvé' };
  }
}

module.exports = new ReminderService();
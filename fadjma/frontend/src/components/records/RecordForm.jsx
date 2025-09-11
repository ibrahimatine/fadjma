import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, FileText, AlertCircle } from 'lucide-react';
import { recordService } from '../../services/recordService';
import toast from 'react-hot-toast';

const RecordForm = ({ onClose, onSuccess, initialData = null }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      type: 'consultation',
      title: '',
      description: '',
      diagnosis: '',
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (initialData) {
        await recordService.update(initialData.id, data);
        toast.success('Dossier mis à jour avec succès');
      } else {
        await recordService.create(data);
        toast.success('Dossier créé et ancré sur Hedera');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {initialData ? 'Modifier le dossier' : 'Nouveau dossier médical'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type de dossier</label>
            <select {...register('type', { required: 'Type requis' })} className="input-field">
              <option value="consultation">Consultation</option>
              <option value="prescription">Prescription</option>
              <option value="test_result">Résultat de test</option>
              <option value="vaccination">Vaccination</option>
              <option value="allergy">Allergie</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.type.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Titre</label>
            <input
              type="text"
              {...register('title', { required: 'Titre requis' })}
              className="input-field"
              placeholder="Ex: Consultation générale"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              {...register('description', { required: 'Description requise' })}
              className="input-field"
              rows="4"
              placeholder="Détails de la consultation..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Diagnostic</label>
            <textarea
              {...register('diagnosis')}
              className="input-field"
              rows="3"
              placeholder="Diagnostic établi..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Enregistrement...' : (initialData ? 'Mettre à jour' : 'Créer et ancrer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordForm;
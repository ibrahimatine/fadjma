import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { recordService } from '../../services/recordService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const RecordForm = ({ recordToEdit }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: recordToEdit?.title || '',
    patientName: recordToEdit?.patientName || '',
    doctorName: recordToEdit?.doctorName || user?.name || '',
    date: recordToEdit?.date ? new Date(recordToEdit.date).toISOString().slice(0, 16) : '',
    type: recordToEdit?.type || '',
    hospital: recordToEdit?.hospital || '',
    department: recordToEdit?.department || '',
    referenceNumber: recordToEdit?.referenceNumber || '',
    description: recordToEdit?.description || '',
    file: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files : value,
    }));
  };

  const createRecordMutation = useMutation(recordService.createRecord, {
    onSuccess: () => {
      queryClient.invalidateQueries('records');
      toast.success('Dossier médical créé avec succès !');
      navigate('/records');
    },
    onError: (err) => {
      toast.error(err.message || 'Erreur lors de la création du dossier.');
    },
  });

  const updateRecordMutation = useMutation(
    (updatedRecord) => recordService.updateRecord(recordToEdit.id, updatedRecord),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['record', recordToEdit.id]);
        queryClient.invalidateQueries('records');
        toast.success('Dossier médical mis à jour avec succès !');
        navigate(`/records/${recordToEdit.id}`);
      },
      onError: (err) => {
        toast.error(err.message || 'Erreur lors de la mise à jour du dossier.');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    }

    if (recordToEdit) {
      updateRecordMutation.mutate(data);
    } else {
      createRecordMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="patientName" className="block text-sm font-medium text-gray-700">Nom du patient</label>
        <input
          type="text"
          id="patientName"
          name="patientName"
          value={formData.patientName}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700">Nom du médecin</label>
        <input
          type="text"
          id="doctorName"
          name="doctorName"
          value={formData.doctorName}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
          disabled={user?.role === 'doctor'}
        />
      </div>
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="datetime-local"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
        <input
          type="text"
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="hospital" className="block text-sm font-medium text-gray-700">Hôpital</label>
        <input
          type="text"
          id="hospital"
          name="hospital"
          value={formData.hospital}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700">Département</label>
        <input
          type="text"
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700">Numéro de référence</label>
        <input
          type="text"
          id="referenceNumber"
          name="referenceNumber"
          value={formData.referenceNumber}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        ></textarea>
      </div>
      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700">Fichier joint</label>
        <input
          type="file"
          id="file"
          name="file"
          onChange={handleChange}
          className="mt-1 block w-full text-gray-700"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300"
        disabled={createRecordMutation.isLoading || updateRecordMutation.isLoading}
      >
        {recordToEdit ? 'Mettre à jour le dossier' : 'Créer le dossier'}
      </button>
    </form>
  );
};

export default RecordForm;
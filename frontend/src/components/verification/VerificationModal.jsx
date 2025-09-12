import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const VerificationModal = ({ isOpen, onClose, result }) => {
  const getIcon = () => {
    if (!result) return <InformationCircleIcon className="h-16 w-16 text-blue-400" />;
    if (result.isVerified) {
      return <CheckCircleIcon className="h-16 w-16 text-green-500" />;
    } else {
      return <XCircleIcon className="h-16 w-16 text-red-500" />;
    }
  };

  const getTitle = () => {
    if (!result) return "Vérification en cours...";
    if (result.isVerified) {
      return "Intégrité Vérifiée !";
    } else {
      return "Échec de la Vérification !";
    }
  };

  const getMessage = () => {
    if (!result) return "Le processus de vérification est en cours. Veuillez patienter.";
    if (result.isVerified) {
      return "Le dossier médical est authentique et n'a pas été altéré.";
    } else {
      return result.message || "Le dossier médical a été altéré ou ne peut être vérifié.";
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="mt-2 text-center">
                  {getIcon()}
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mt-4"
                  >
                    {getTitle()}
                  </Dialog.Title>
                  <p className="text-sm text-gray-500 mt-2">
                    {getMessage()}
                  </p>
                  {result?.transactionId && (
                    <p className="text-sm text-gray-500 mt-2">
                      <strong>ID de transaction Hedera:</strong> {result.transactionId}
                    </p>
                  )}
                  {result?.timestamp && (
                    <p className="text-sm text-gray-500 mt-2">
                      <strong>Horodatage:</strong> {format(new Date(result.timestamp), 'dd MMMM yyyy HH:mm', { locale: fr })}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Fermer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default VerificationModal;
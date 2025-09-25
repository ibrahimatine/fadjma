import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Pill,
  CheckCircle,
  AlertCircle,
  Package,
  Clock,
  X,
  Users,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

const PharmacyCart = ({ onStartBatchDispensation, onClearCart }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    uniquePatients: 0,
    totalMedications: 0
  });

  // Charger le panier depuis localStorage au démarrage
  useEffect(() => {
    const savedCart = localStorage.getItem('pharmacyCart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCartItems(parsedCart);
      updateSummary(parsedCart);
    }
  }, []);

  // Sauvegarder le panier dans localStorage
  const saveCart = (items) => {
    localStorage.setItem('pharmacyCart', JSON.stringify(items));
    updateSummary(items);
  };

  const updateSummary = (items) => {
    const summary = {
      totalItems: items.length,
      uniquePatients: new Set(items.map(item => item.prescription.patientId)).size,
      totalMedications: items.reduce((acc, item) => acc + (item.quantity || 1), 0)
    };
    setCartSummary(summary);
  };

  // Ajouter une prescription au panier
  const addToCart = (prescription, quantity = 1) => {
    const existingIndex = cartItems.findIndex(
      item => item.prescription.matricule === prescription.matricule
    );

    let newItems;
    if (existingIndex >= 0) {
      // Mettre à jour la quantité si déjà présent
      newItems = cartItems.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      toast.success('Quantité mise à jour dans le panier');
    } else {
      // Ajouter nouveau item
      const cartItem = {
        id: Date.now(),
        prescription,
        quantity,
        addedAt: new Date().toISOString(),
        status: 'pending' // pending, processing, completed
      };
      newItems = [...cartItems, cartItem];
      toast.success('Médicament ajouté au panier');
    }

    setCartItems(newItems);
    saveCart(newItems);
  };

  // Retirer du panier
  const removeFromCart = (matricule) => {
    const newItems = cartItems.filter(
      item => item.prescription.matricule !== matricule
    );
    setCartItems(newItems);
    saveCart(newItems);
    toast.success('Médicament retiré du panier');
  };

  // Modifier la quantité
  const updateQuantity = (matricule, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(matricule);
      return;
    }

    const newItems = cartItems.map(item =>
      item.prescription.matricule === matricule
        ? { ...item, quantity: newQuantity }
        : item
    );
    setCartItems(newItems);
    saveCart(newItems);
  };

  // Vider le panier
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('pharmacyCart');
    updateSummary([]);
    toast.success('Panier vidé');
    if (onClearCart) onClearCart();
  };

  // Grouper par patient
  const groupedByPatient = cartItems.reduce((acc, item) => {
    const patientId = item.prescription.patientId;
    if (!acc[patientId]) {
      acc[patientId] = {
        patient: item.prescription.patient,
        items: []
      };
    }
    acc[patientId].items.push(item);
    return acc;
  }, {});

  const handleStartDispensation = () => {
    if (cartItems.length === 0) {
      toast.error('Le panier est vide');
      return;
    }
    onStartBatchDispensation(cartItems, groupedByPatient);
  };

  // Fonction exposée pour ajouter au panier depuis l'extérieur
  window.addToPharmacyCart = addToCart;

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Panier vide</h3>
          <p className="text-gray-600">
            Recherchez des médicaments par matricule pour les ajouter au panier
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header du panier */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Panier de dispensation</h2>
              <p className="opacity-90">
                {cartSummary.totalItems} médicament(s) • {cartSummary.uniquePatients} patient(s)
              </p>
            </div>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Vider
          </button>
        </div>
      </div>

      {/* Résumé rapide */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-900">{cartSummary.totalMedications}</div>
              <div className="text-sm text-gray-600">Unités totales</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-semibold text-gray-900">{cartSummary.uniquePatients}</div>
              <div className="text-sm text-gray-600">Patient(s)</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            <div>
              <div className="font-semibold text-gray-900">~{Math.ceil(cartSummary.totalItems * 2)}min</div>
              <div className="text-sm text-gray-600">Temps estimé</div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des items groupés par patient */}
      <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
        {Object.entries(groupedByPatient).map(([patientId, group]) => (
          <div key={patientId} className="border border-gray-200 rounded-lg p-4">
            {/* Info patient */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {group.patient?.firstName} {group.patient?.lastName}
                </h3>
                <p className="text-sm text-gray-600">{group.patient?.email}</p>
              </div>
              <div className="ml-auto">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                  {group.items.length} médicament(s)
                </span>
              </div>
            </div>

            {/* Médicaments pour ce patient */}
            <div className="space-y-3">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Pill className="h-4 w-4 text-green-600" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {item.prescription.medication}
                      </h4>
                      <span className="text-sm text-gray-600">
                        {item.prescription.dosage}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Matricule: {item.prescription.matricule}
                    </div>
                  </div>

                  {/* Contrôles quantité */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.prescription.matricule, item.quantity - 1)}
                      className="p-1 bg-white rounded border hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.prescription.matricule, item.quantity + 1)}
                      className="p-1 bg-white rounded border hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() => removeFromCart(item.prescription.matricule)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions du panier */}
      <div className="p-6 bg-gray-50 border-t">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600">
            Prêt pour la dispensation groupée
          </div>

          <div className="flex gap-3">
            <button
              onClick={clearCart}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Vider le panier
            </button>

            <button
              onClick={handleStartDispensation}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
            >
              <FileText className="h-5 w-5" />
              Commencer la dispensation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyCart;
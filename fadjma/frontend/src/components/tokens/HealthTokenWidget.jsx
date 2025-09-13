import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp, Gift, Info } from 'lucide-react';
import api from '../../services/api';

const HealthTokenWidget = () => {
  const [tokenData, setTokenData] = useState({
    balance: 0,
    valueUSD: 0,
    price: { priceUSD: 0.10, change24h: 0 }
  });
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await api.get('/nft/health-tokens/balance');
      setTokenData(response.data);
    } catch (error) {
      console.error('Erreur récupération balance:', error);
    }
  };

  const rewards = [
    { action: 'Créer un dossier', amount: 10, icon: '📝' },
    { action: 'Vaccination', amount: 20, icon: '💉' },
    { action: 'Vérification', amount: 5, icon: '✅' },
    { action: 'Mise à jour mensuelle', amount: 15, icon: '📅' }
  ];

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6" />
            HEALTH Tokens
          </h3>
          <p className="text-sm opacity-90">Vos récompenses santé</p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <div className="text-4xl font-bold">
          {tokenData.balance} HEALTH
        </div>
        <div className="text-sm opacity-90">
          ≈ ${tokenData.valueUSD} USD
        </div>
      </div>

      {/* Prix et variation */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <span className="opacity-90">Prix:</span>
          <span className="font-medium">${tokenData.price.priceUSD}</span>
        </div>
        <div className={`flex items-center gap-1 ${tokenData.price.change24h >= 0 ? 'text-green-300' : 'text-red-300'}`}>
          <TrendingUp className="h-3 w-3" />
          <span>{tokenData.price.change24h >= 0 ? '+' : ''}{tokenData.price.change24h}%</span>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="mt-4 pt-4 border-t border-white/30">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Comment gagner des tokens
          </h4>
          <div className="space-y-2">
            {rewards.map((reward, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <span>{reward.icon}</span>
                  <span className="opacity-90">{reward.action}</span>
                </span>
                <span className="font-medium">+{reward.amount}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs opacity-80">
            Les tokens peuvent être échangés contre des consultations ou des services médicaux
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthTokenWidget;

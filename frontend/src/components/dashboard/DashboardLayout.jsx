import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
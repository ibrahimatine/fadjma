import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { useLocation } from 'react-router-dom';

const Login = () => {
  const location = useLocation();
  const isRegisterPath = location.pathname === '/register';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      {isRegisterPath ? <RegisterForm /> : <LoginForm />}
    </div>
  );
};

export default Login;
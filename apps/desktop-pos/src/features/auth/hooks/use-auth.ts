import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const login = async (pin: string) => {
    try {
      setIsLoading(true);
      setError('');

      // The Trainee doesn't know this is IPC
      const user = await window.api.invoke('auth:login', pin);

      if (user) {
        sessionStorage.setItem('algo_user', JSON.stringify(user));
        navigate('/');
        return true;
      }
    } catch (err) {
      console.error('Login failed', err);
      setError('Invalid PIN');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error, setError };
}

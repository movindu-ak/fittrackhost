import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Session expired. Please login again.');
    navigate('/login');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(logout, SESSION_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);
};
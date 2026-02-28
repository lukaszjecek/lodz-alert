import React, { createContext, useState } from 'react';
import { INITIAL_REPORTS, INITIAL_POINTS, MOCK_TRAMS, INITIAL_TRANSACTIONS } from '../utils/mockData';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [trams, setTrams] = useState(MOCK_TRAMS); 
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const addTransactionEntry = (type, amount, description) => {
        const newTransaction = {
            id: Date.now().toString() + type,
            type: type, 
            amount: amount,
            description: description,
            date: new Date().toISOString().split('T')[0],
        };
    setTransactions(prev => [newTransaction, ...prev]); 
  };

  const addPoints = (amount, description = 'Inne') => {
        const type = amount > 0 ? 'EARNED' : 'REDEEMED';

        setPoints(prev => prev + amount);

        addTransactionEntry(type, amount, description);
    };
  
  const addReport = (title, category, earnedPoints, lat, long) => { 
        const newReport = {
            id: Date.now().toString(),
            lat: lat ? lat.toString() : 51.7620,
            long: long ? long.toString() : 19.4570,
            title,
            category,
            status: "OCZEKUJĄCY", 
            date: new Date().toISOString().split('T')[0],
            points: earnedPoints, 
        };
        setReports(prev => [newReport, ...prev]);
  };

  const updateTramPrediction = (id, delay) => {
      setTrams(prevTrams => 
          prevTrams.map(t => t.id === id ? { ...t, predictedDelayMin: delay } : t)
      );
  };


  return (
    <UserContext.Provider value={{ 
        points, 
        addPoints,
        reports, 
        addReport, 
        trams, 
        updateTramPrediction, 
        transactions,
    }}>
      {children}
    </UserContext.Provider>
  );
};
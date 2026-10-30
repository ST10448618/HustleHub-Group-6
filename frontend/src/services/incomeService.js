import api from './api';

export async function getMyIncome() {
  const envelope = await api.get('/income/me');
  return envelope.data;
}

export async function getMyTax() {
  const envelope = await api.get('/income/tax');
  return envelope.data;
}
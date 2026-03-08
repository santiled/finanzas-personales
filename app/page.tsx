"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, PiggyBank, Trash2, PlusCircle, DollarSign, Moon, Sun, History, Calendar, LogOut, Lock, Mail, User, Download, Star, X, Menu, CreditCard, LayoutDashboard, ChevronLeft, ChevronRight, Bell, BellOff
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- TIPOS Y CONSTANTES ---

type TransactionType = 'ingreso' | 'gasto' | 'ahorro';

type Category = 
  | 'Salario' | 'Freelance' | 'Inversiones' // Ingresos
  | 'Fijos' | 'Hormiga' | 'Entretenimiento' | 'Salud' | 'Educación' // Gastos
  | 'Fondo de Emergencia' | 'DollarApp' | 'Otro Ahorro'; // Ahorros

interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  is_dollar_app?: boolean; // Específico para el contexto económico (snake_case para DB)
  user_id?: string;
}

interface Credit {
  id: string;
  description: string;
  bank: string;
  monthly_amount: number;
  total_months: number;
  start_date: string;
  cutoff_day: number;
  payment_day: number;
  user_id: string;
  alerts_enabled?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- UTILIDADES ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// --- COMPONENTES UI (Modularizados) ---

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Masculino');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              gender: gender,
            }
          }
        });
        if (error) throw error;
        setMessage({ text: '¡Registro exitoso! Revisa tu correo para confirmar.', type: 'success' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage({ text: 'Por favor ingresa tu correo arriba para recuperar la contraseña.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      });
      if (error) throw error;
      setMessage({ text: 'Se ha enviado un correo para restablecer tu contraseña.', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setMessage({ text: error.message, type: 'error' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100 dark:border-slate-700">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finanzas Personales</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Gestiona tus ingresos y gastos</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    className="w-full pl-10 p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Tu nombre"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Género</label>
                <select 
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="email" 
                required
                className="w-full pl-10 p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="password" 
                required
                className="w-full pl-10 p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isSignUp && (
            <div className="flex justify-end">
              <button type="button" onClick={handleResetPassword} className="text-xs text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Procesando...' : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-slate-800 text-slate-500">O continuar con</span></div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <span className="font-medium text-slate-700 dark:text-slate-200">Google</span>
            </button>
          </div>
        </div>

        <p className="text-center mt-8 text-sm text-slate-500">
          {isSignUp ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}
          <button onClick={() => setIsSignUp(!isSignUp)} className="ml-1 text-blue-600 font-medium hover:underline">
            {isSignUp ? "Inicia Sesión" : "Regístrate"}
          </button>
        </p>
      </div>
    </div>
  );
};

const Card = ({ title, amount, icon: Icon, colorClass, subtext }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">{formatCurrency(amount)}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const TransactionForm = ({ onAdd, onSaveTemplate, initialData }: { onAdd: (t: Omit<Transaction, 'id'>) => void, onSaveTemplate: (t: Omit<Transaction, 'id'>) => void, initialData: Partial<Transaction> | null }) => {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'gasto' as TransactionType,
    category: 'Fijos',
    description: '',
    date: new Date().toISOString().split('T')[0],
    is_dollar_app: false
  });
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Efecto para cargar datos desde el historial/plantilla
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        amount: initialData.amount?.toString() || '',
        type: initialData.type || 'gasto',
        category: initialData.category || 'Fijos',
        description: initialData.description || '',
        date: new Date().toISOString().split('T')[0],
        is_dollar_app: initialData.is_dollar_app || false
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    if (Number(formData.amount) <= 0) {
      alert("El monto debe ser mayor a 0");
      return;
    }

    const newTransaction = {
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category,
      description: formData.description,
      date: formData.date,
      is_dollar_app: formData.type === 'ahorro' ? formData.is_dollar_app : false
    };

    onAdd(newTransaction);

    if (saveAsTemplate) {
      onSaveTemplate(newTransaction);
    }

    setFormData({ ...formData, amount: '', description: '', is_dollar_app: false });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
        <PlusCircle size={20} /> Nueva Transacción
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
          <select 
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as TransactionType})}
          >
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
            <option value="ahorro">Ahorro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
          <select 
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            {formData.type === 'gasto' && (
              <>
                <option value="Fijos">Gastos Fijos</option>
                <option value="Hormiga">Gastos Hormiga</option>
                <option value="Entretenimiento">Entretenimiento</option>
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
              </>
            )}
            {formData.type === 'ingreso' && (
              <>
                <option value="Salario">Salario</option>
                <option value="Freelance">Freelance</option>
              </>
            )}
            {formData.type === 'ahorro' && (
              <>
                <option value="General">Ahorro General</option>
                <option value="DollarApp">DollarApp (USD)</option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monto (COP)</label>
          <input 
            type="number" 
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white"
            placeholder="0"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
          <input 
            type="date" 
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción</label>
          <input 
            type="text" 
            className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white"
            placeholder="Ej: Mercado, Netflix, Ahorro mensual..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <input 
            type="checkbox" 
            id="saveTemplate"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
            className="w-4 h-4 text-yellow-500 rounded border-slate-300 focus:ring-yellow-500"
          />
          <label htmlFor="saveTemplate" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer flex items-center gap-1">
            <Star size={14} className={saveAsTemplate ? "fill-yellow-500 text-yellow-500" : ""} /> Guardar como frecuente
          </label>
        </div>

        {formData.type === 'ahorro' && (
          <div className="md:col-span-2 flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <input 
              type="checkbox" 
              id="dollarApp"
              checked={formData.is_dollar_app}
              onChange={(e) => setFormData({...formData, is_dollar_app: e.target.checked})}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="dollarApp" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              ¿Enviado a <strong>DollarApp</strong>? (Se marcará como activo en USD)
            </label>
          </div>
        )}
      </div>

      <button 
        type="submit" 
        className="w-full mt-6 bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors"
      >
        Registrar Transacción
      </button>
    </form>
  );
};

const CreditForm = ({ onAdd }: { onAdd: (c: Omit<Credit, 'id' | 'user_id'>) => void }) => {
  const [formData, setFormData] = useState({
    description: '',
    bank: '',
    monthly_amount: '',
    total_months: '',
    start_date: new Date().toISOString().split('T')[0],
    cutoff_day: '',
    payment_day: '',
    alerts_enabled: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.monthly_amount) return;

    onAdd({
      description: formData.description,
      bank: formData.bank,
      monthly_amount: Number(formData.monthly_amount),
      total_months: Number(formData.total_months),
      start_date: formData.start_date,
      cutoff_day: Number(formData.cutoff_day),
      payment_day: Number(formData.payment_day),
      alerts_enabled: formData.alerts_enabled
    });

    setFormData({
      description: '', bank: '', monthly_amount: '', total_months: '', 
      start_date: new Date().toISOString().split('T')[0], cutoff_day: '', payment_day: '', alerts_enabled: true
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 mb-8">
      <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
        <PlusCircle size={20} /> Nuevo Crédito
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <input type="text" placeholder="Descripción (ej: iPhone)" className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
        <input type="text" placeholder="Banco" className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} required />
        <input type="number" placeholder="Cuota Mensual" className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white" value={formData.monthly_amount} onChange={e => setFormData({...formData, monthly_amount: e.target.value})} required />
        <input type="number" placeholder="Plazo (Meses)" className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white" value={formData.total_months} onChange={e => setFormData({...formData, total_months: e.target.value})} required />
        <input type="date" placeholder="Fecha Inicio" className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
        <input type="number" placeholder="Día de Corte (1-31)" min="1" max="31" className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white" value={formData.cutoff_day} onChange={e => setFormData({...formData, cutoff_day: e.target.value})} required />
        <input type="number" placeholder="Día de Pago (1-31)" min="1" max="31" className="p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent dark:text-white" value={formData.payment_day} onChange={e => setFormData({...formData, payment_day: e.target.value})} required />
        <div className="flex items-center gap-2 md:col-span-2 lg:col-span-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
          <input type="checkbox" id="alerts" checked={formData.alerts_enabled} onChange={e => setFormData({...formData, alerts_enabled: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
          <label htmlFor="alerts" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Activar alertas por correo (3 días antes)</label>
        </div>
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors">Agregar Crédito</button>
      </div>
    </form>
  );
};

const CreditsView = ({ session, currentMonth }: { session: Session, currentMonth: string }) => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      // Cargar Créditos
      const { data: creditsData } = await supabase.from('credits').select('*');
      if (creditsData) setCredits(creditsData);

      // Cargar Transacciones del mes para el calendario
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .like('date', `${currentMonth}%`);
      if (transactionsData) setTransactions(transactionsData);
    };
    fetchData();
  }, [currentMonth]);

  const addCredit = async (c: Omit<Credit, 'id' | 'user_id'>) => {
    const { data, error } = await supabase.from('credits').insert([c]).select();
    if (data) setCredits(prev => [...prev, data[0]]);
    if (error) alert(error.message);
  };

  const deleteCredit = async (id: string) => {
    if (!confirm('¿Eliminar crédito?')) return;
    await supabase.from('credits').delete().eq('id', id);
    setCredits(prev => prev.filter(c => c.id !== id));
  };

  const toggleAlerts = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase.from('credits').update({ alerts_enabled: newStatus }).eq('id', id);
    if (!error) {
      setCredits(prev => prev.map(c => c.id === id ? { ...c, alerts_enabled: newStatus } : c));
    }
  };

  const testReminders = async () => {
    if (!confirm("Esto simulará el proceso diario y enviará correos si hay pagos en 3 días. ¿Continuar?")) return;
    try {
      const res = await fetch('/api/cron/reminders');
      const data = await res.json();
      alert(`Resultado: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      alert("Error al ejecutar recordatorios");
    }
  };

  // Filtrar créditos activos en el mes seleccionado
  const activeCredits = useMemo(() => {
    return credits.filter(c => {
      const start = new Date(c.start_date);
      const end = new Date(start);
      end.setMonth(start.getMonth() + c.total_months);
      const current = new Date(currentMonth + '-01');
      // Ajuste para comparar mes/año ignorando día
      const currentEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      return start <= currentEnd && end >= current;
    });
  }, [credits, currentMonth]);

  const totalToPay = activeCredits.reduce((acc, c) => acc + c.monthly_amount, 0);

  // Generar Calendario
  const calendarDays = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      // Eventos de Créditos
      const creditEvents = activeCredits
        .filter(c => c.payment_day === i || c.cutoff_day === i)
        .map(c => ({
          type: c.payment_day === i ? 'credit_payment' : 'credit_cutoff',
          name: c.description,
          amount: c.monthly_amount,
          id: c.id
        }));

      // Eventos de Transacciones
      const transactionEvents = transactions
        .filter(t => parseInt(t.date.split('-')[2]) === i)
        .map(t => ({
          type: t.type, // 'ingreso', 'gasto', 'ahorro'
          name: t.description,
          amount: t.amount,
          id: t.id
        }));

      days.push({ day: i, events: [...creditEvents, ...transactionEvents] });
    }
    return days;
  }, [currentMonth, activeCredits, transactions]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'credit_payment': return 'bg-red-600';
      case 'credit_cutoff': return 'bg-yellow-400';
      case 'gasto': return 'bg-red-400';
      case 'ingreso': return 'bg-green-500';
      case 'ahorro': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CreditForm onAdd={addCredit} />
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Créditos Activos ({currentMonth})</h3>
              <div className="flex items-center gap-4">
                <button onClick={testReminders} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors" title="Probar recordatorios (Simulación)">
                  <Bell size={18} />
                </button>
                <span className="text-xl font-bold text-red-600">Total: {formatCurrency(totalToPay)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="p-4">Descripción</th>
                    <th className="p-4">Banco</th>
                    <th className="p-4">Cuota</th>
                    <th className="p-4">Corte / Pago</th>
                    <th className="p-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {activeCredits.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="p-4 font-medium dark:text-white">{c.description}</td>
                      <td className="p-4 dark:text-slate-300">{c.bank}</td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{formatCurrency(c.monthly_amount)}</td>
                      <td className="p-4 text-xs text-slate-500">
                        <div className="flex gap-2">
                          <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Corte: {c.cutoff_day}</span>
                          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded">Pago: {c.payment_day}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => toggleAlerts(c.id, c.alerts_enabled ?? true)} 
                            className={`p-2 rounded-full transition-colors ${c.alerts_enabled !== false ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                            title={c.alerts_enabled !== false ? "Desactivar alertas" : "Activar alertas"}
                          >
                            {c.alerts_enabled !== false ? <Bell size={18} /> : <BellOff size={18} />}
                          </button>
                          <button onClick={() => deleteCredit(c.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeCredits.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No hay créditos activos este mes.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar size={20} /> Calendario de Pagos
          </h3>
          <div className="grid grid-cols-7 gap-2 text-center text-xs mb-2 text-slate-400 font-medium">
            {['D','L','M','M','J','V','S'].map((d,i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((d) => (
              <div key={d.day} className={`aspect-square rounded-lg border ${d.events.length > 0 ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' : 'border-slate-100 dark:border-slate-700'} p-1 flex flex-col items-center justify-start relative overflow-hidden`}>
                <span className={`text-xs font-bold ${d.events.length > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>{d.day}</span>
                <div className="flex flex-col gap-0.5 w-full mt-1">
                  {d.events.map((e, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 w-full rounded-full ${getEventColor(e.type)}`} 
                      title={`${e.name} - ${formatCurrency(e.amount)} (${e.type})`} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs justify-center">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400"></div><span>Corte</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-600"></div><span>Pago Crédito</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Ingreso</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-400"></div><span>Gasto</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Ahorro</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TransactionList = ({ transactions, onDelete }: { transactions: Transaction[], onDelete: (id: string) => void }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Transacciones Recientes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="p-4 font-medium">Fecha</th>
              <th className="p-4 font-medium">Descripción</th>
              <th className="p-4 font-medium">Categoría</th>
              <th className="p-4 font-medium text-right">Monto</th>
              <th className="p-4 font-medium text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">No hay transacciones registradas.</td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-4 text-slate-600 dark:text-slate-300">{t.date}</td>
                  <td className="p-4 font-medium text-slate-900 dark:text-white">
                    {t.description}
                    {t.is_dollar_app && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">USD</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${t.type === 'ingreso' ? 'bg-green-100 text-green-700' : 
                        t.type === 'gasto' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold ${
                    t.type === 'ingreso' ? 'text-green-600' : 
                    t.type === 'gasto' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {t.type === 'gasto' ? '-' : '+'}{formatCurrency(t.amount)}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DashboardView = ({ session, currentMonth }: { session: Session, currentMonth: string }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [templates, setTemplates] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<Partial<Transaction> | null>(null);

  // Cargar datos (Solo si hay sesión)
  useEffect(() => {
    fetchTransactions();
  }, [session]); // Recargar si cambia la sesión (aunque DashboardView se desmonta si no hay sesión)

  // Cargar plantillas desde localStorage
  useEffect(() => {
    if (session?.user?.id) {
      const saved = localStorage.getItem(`finance_templates_${session.user.id}`);
      if (saved) setTemplates(JSON.parse(saved));
    }
  }, [session]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      if (data) setTransactions(data);
    } catch (err: any) {
      console.error('Error cargando transacciones:', err);
      setError(err.message || "Error crítico de conexión. Verifica las variables en Vercel.");
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!session) return;

    // Optimistic UI update (opcional, aquí hacemos la llamada directa)
    const { data, error } = await supabase
      .from('transactions')
      .insert([t])
      .select();

    if (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar la transacción');
    } else if (data) {
      setTransactions(prev => [data[0], ...prev]);
    }
  };

  const handleSaveTemplate = (t: Omit<Transaction, 'id'>) => {
    if (!session?.user?.id) return;
    const newTemplate = { ...t, id: crypto.randomUUID() } as Transaction;
    setTemplates(prev => {
      const updated = [newTemplate, ...prev].slice(0, 10); // Máximo 10
      localStorage.setItem(`finance_templates_${session.user.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteTemplate = (id: string) => {
    if (!session?.user?.id) return;
    setTemplates(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem(`finance_templates_${session.user.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTransaction = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta transacción?")) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar');
    } else {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Título y Encabezado
    doc.setFontSize(18);
    doc.text('Reporte Financiero Mensual', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Periodo: ${currentMonth}`, 14, 36);

    // Resumen de Métricas
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Ingresos Totales: ${formatCurrency(metrics.income)}`, 14, 50);
    doc.text(`Gastos Totales: ${formatCurrency(metrics.expense)}`, 14, 58);
    doc.text(`Ahorros Totales: ${formatCurrency(metrics.savings)}`, 14, 66);
    doc.text(`Balance Neto: ${formatCurrency(metrics.netBalance)}`, 14, 74);

    // Tabla de Transacciones
    const tableData = filteredTransactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.type.toUpperCase(),
      formatCurrency(t.amount)
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Monto']],
      body: tableData,
      headStyles: { fillColor: [37, 99, 235] }, // Azul similar al de la app
      styles: { fontSize: 10 },
    });

    doc.save(`reporte-finanzas-${currentMonth}.pdf`);
  };

  // Filtrar transacciones por mes seleccionado
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonth));
  }, [transactions, currentMonth]);

  // Cálculos Financieros
  const metrics = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'ingreso').reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions.filter(t => t.type === 'gasto').reduce((acc, t) => acc + t.amount, 0);
    const savings = filteredTransactions.filter(t => t.type === 'ahorro').reduce((acc, t) => acc + t.amount, 0);
    
    // Balance Neto = Ingresos - Gastos (El ahorro es parte del patrimonio, no un gasto, pero sale del flujo de caja disponible)
    const netBalance = income - expense; 

    return { income, expense, savings, netBalance };
  }, [filteredTransactions]);

  // Datos para Gráficas
  const chartData = useMemo(() => {
    // Gastos por categoría
    const expensesByCategory = filteredTransactions
      .filter(t => t.type === 'gasto')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const pieData = Object.keys(expensesByCategory).map((key) => ({
      name: key,
      value: expensesByCategory[key]
    }));

    // Comparativa simple
    const barData = [
      { name: 'Ingresos', amount: metrics.income },
      { name: 'Gastos', amount: metrics.expense },
      { name: 'Ahorro', amount: metrics.savings },
    ];

    return { pieData, barData };
  }, [filteredTransactions, metrics]);

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error detectado: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading && <p className="text-center text-slate-500">Cargando datos financieros...</p>}

      {/* Actions Bar: Download */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <Download size={16} /> Descargar Reporte
        </button>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Ingresos Totales" amount={metrics.income} icon={TrendingUp} colorClass="bg-green-500" />
        <Card title="Gastos Totales" amount={metrics.expense} icon={TrendingDown} colorClass="bg-red-500" />
        <Card title="Ahorros Totales" amount={metrics.savings} icon={PiggyBank} colorClass="bg-blue-500" />
        <Card title="Balance Neto" amount={metrics.netBalance} icon={DollarSign} colorClass="bg-slate-700" subtext="Ingresos - Gastos" />
      </div>

      {/* Charts & Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bar Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-6">Flujo de Caja</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-6">Distribución de Gastos</h3>
            <div className="h-64 w-full flex items-center justify-center">
              {chartData.pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-slate-400 text-sm">No hay gastos registrados para mostrar.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-1">
          {/* Quick Add Templates */}
          {templates.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <History size={14} /> Usar registro frecuente
              </h3>
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <div key={t.id} className="relative group">
                    <button onClick={() => setTemplateData(t)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm text-left pr-6" title={`Usar: ${t.description} - ${formatCurrency(t.amount)}`}>
                      <span className="font-medium block truncate max-w-[120px]">{t.description}</span>
                      <span className="text-slate-400">{formatCurrency(t.amount)}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(t.id); }} className="absolute -top-1.5 -right-1.5 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-200">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <TransactionForm onAdd={addTransaction} onSaveTemplate={handleSaveTemplate} initialData={templateData} />
        </div>
      </div>

      {/* Transaction Table */}
      <TransactionList transactions={filteredTransactions} onDelete={deleteTransaction} />
    </div>
  );
};

// --- PÁGINA PRINCIPAL (LAYOUT & STATE) ---

export default function FinancialDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeView, setActiveView] = useState<'dashboard' | 'credits'>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Gestión de Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <AuthForm />;
  }

  // Obtener datos del usuario para el saludo
  const userMetaData = session?.user?.user_metadata;
  const greeting = userMetaData?.gender === 'Femenino' ? 'Bienvenida' : 'Bienvenido';
  const displayName = userMetaData?.full_name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'Usuario';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-20">
      
      {/* Sidebar (Mobile & Desktop) */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-lg">Menú</h2>
          <button onClick={() => setIsMenuOpen(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
        </div>
        <nav className="p-4 space-y-2">
          <button onClick={() => { setActiveView('dashboard'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeView === 'dashboard' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button onClick={() => { setActiveView('credits'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeView === 'credits' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <CreditCard size={20} /> Créditos
          </button>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setIsMenuOpen(false)} />}

      {/* Header */}
      <header className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMenuOpen(true)} className="p-2 mr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <Menu size={24} />
            </button>
            <div className="bg-blue-600 p-2 rounded-lg">
              <Wallet className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{greeting} {displayName}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Finanzas Personales</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Global Month Filter */}
            <div className="hidden sm:flex items-center gap-2">
              <Calendar size={16} className="text-slate-400" />
              <input 
                type="month" 
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="p-1.5 rounded border border-slate-300 dark:border-slate-600 bg-transparent text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-slate-500 hidden sm:block">{session.user.email}</div>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 transition-colors" title="Cerrar Sesión">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeView === 'dashboard' ? (
          <DashboardView session={session} currentMonth={currentMonth} />
        ) : (
          <CreditsView session={session} currentMonth={currentMonth} />
        )}
      </main>
    </div>
  );
}

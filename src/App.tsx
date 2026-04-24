/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Calendar, 
  Clock, 
  BookOpen, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Coffee, 
  MessageCircle, 
  Gift, 
  Brain, 
  Activity, 
  UtensilsCrossed 
} from 'lucide-react';

// --- Types ---

interface UserData {
  userName: string;
  partnerName: string;
  lastPeriodDate: string;
  cycleLength: number;
  periodLength: number;
}

interface PhaseInfo {
  id: 'menstrual' | 'folicular' | 'ovulatoria' | 'lutea_temprana' | 'premenstrual';
  name: string;
  poeticName: string;
  color: string;
  bgColor: string;
  description: string;
  physical: string;
  emotional: string;
  intimacy: string;
  cravings: string;
  communication: string;
  gesture: string;
  range: [number, number]; // Cycle day range
}

// --- Data Constants ---

const PHASES: PhaseInfo[] = [
  {
    id: 'menstrual',
    name: 'Menstrual',
    poeticName: 'Fase de Invierno e Introspección',
    color: '#8B2E4B',
    bgColor: 'bg-[#8B2E4B]',
    description: 'Es un momento de renovación profunda. Su cuerpo está soltando para volver a empezar.',
    physical: 'Fatiga, calambres, sensibilidad al frío y necesidad de mucho descanso.',
    emotional: 'Introvertida, reflexiva. Puede sentirse más vulnerable o sensible al entorno.',
    intimacy: 'Deseo generalmente bajo. La cercanía física sin presión es muy valorada.',
    cravings: 'Chocolate negro, alimentos calientes, carbohidratos reconfortantes y hierro.',
    communication: 'Escucha más de lo que hablas. Evita debates intensos o decisiones apresuradas.',
    gesture: 'Prepárale una manta caliente, un té o sorpréndela con su comida reconfortante favorita.',
    range: [1, 5]
  },
  {
    id: 'folicular',
    name: 'Folicular',
    poeticName: 'Fase de Primavera y Renovación',
    color: '#6B8F71',
    bgColor: 'bg-[#6B8F71]',
    description: 'La energía comienza a brotar. Ella se siente más ligera, creativa y abierta al mundo.',
    physical: 'Energía creciente, piel más luminosa y sensación de ligereza corporal.',
    emotional: 'Optimismo, ganas de socializar, creatividad y apertura a nuevas ideas.',
    intimacy: 'Deseo en aumento. Está más abierta a explorar y a la iniciativa constante.',
    cravings: 'Platos variados, ensaladas frescas, frutas y ganas de probar sabores nuevos.',
    communication: 'Excelente momento para planificar viajes, proyectos o conversaciones importantes.',
    gesture: 'Propón una salida espontánea o una actividad que nunca hayan hecho antes.',
    range: [6, 13]
  },
  {
    id: 'ovulatoria',
    name: 'Ovulatoria',
    poeticName: 'Fase de Verano y Plenitud',
    color: '#C4973A',
    bgColor: 'bg-[#C4973A]',
    description: 'Es su pico de vitalidad y conexión. Se siente radiante y magnética.',
    physical: 'Máxima energía, alta resistencia física y se siente especialmente atractiva.',
    emotional: 'Seguridad en sí misma, carisma y una conexión social muy elevada.',
    intimacy: 'Deseo máximo. Es el momento de mayor receptividad y conexión física intensa.',
    cravings: 'Apetito más ligero, prefiere comidas saludables pero elegantes.',
    communication: 'Perfecto para la conexión emocional profunda y palabras de admiración sincera.',
    gesture: 'Dedícale tu presencia total. Una cena romántica o simplemente admirarla será suficiente.',
    range: [14, 16]
  },
  {
    id: 'lutea_temprana',
    name: 'Lútea Temprana',
    poeticName: 'Fase de Otoño y Recolección',
    color: '#7B6B9E',
    bgColor: 'bg-[#7B6B9E]',
    description: 'La energía empieza a descender suavemente. El foco vuelve hacia el hogar y el orden.',
    physical: 'Bajada de energía gradual. Puede empezar a sentirse un poco más hinchada.',
    emotional: 'Más reflexiva, necesita orden a su alrededor y momentos de paz.',
    intimacy: 'Deseo variable. Busca más la ternura y la seguridad emocional.',
    cravings: 'Alimentos más sustanciosos, ganas de picar algo salado.',
    communication: 'Habla sobre el hogar, el bienestar y mantén un tono suave y acogedor.',
    gesture: 'Ayúdala con las tareas del hogar sin que lo pida. El orden le dará paz mental.',
    range: [17, 22]
  },
  {
    id: 'premenstrual',
    name: 'Premenstrual',
    poeticName: 'Fase de Tormenta y Sensibilidad',
    color: '#5D4B7A', // Deeper version of Luteal
    bgColor: 'bg-[#5D4B7A]',
    description: 'Sensibilidad a flor de piel. Su cuerpo y mente necesitan validación y paciencia.',
    physical: 'Sensibilidad en los pechos, hinchazón, posibles dolores de cabeza.',
    emotional: 'Mayor sensibilidad, posible irritabilidad o ganas de llorar sin motivo aparente.',
    intimacy: 'Deseo a menudo bajo. La paciencia y el afecto no sexual son claves.',
    cravings: 'Antojos intensos de dulce y salado. Hambre emocional.',
    communication: 'EVITA críticas. Valida sus sentimientos: "Te entiendo", "Estoy aquí".',
    gesture: 'Palabras de afirmación. Dile lo mucho que la valoras y lo bien que lo está haciendo.',
    range: [23, 28] // Note: this adjusts if cycle > 28
  }
];

// --- Helpers ---

const getCycleDay = (lastDateStr: string, cycleLen: number) => {
  const lastDate = new Date(lastDateStr);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return (diffDays % cycleLen) + 1;
};

const getPhaseForDay = (day: number, cycleLen: number) => {
  // Adjust ranges for non-28 day cycles
  const ratio = cycleLen / 28;
  if (day <= 5) return PHASES[0]; // Menstrual usually fixed
  if (day <= 13 * ratio) return PHASES[1];
  if (day <= 16 * ratio) return PHASES[2];
  if (day <= 22 * ratio) return PHASES[3];
  return PHASES[4];
};

const getDaysRelativeToNextPeriod = (day: number, cycleLen: number) => {
  return cycleLen - day;
};

// --- Components ---

function SetupView({ onSave, initialData, onCancel }: { onSave: (data: UserData) => void, initialData?: UserData, onCancel?: () => void }) {
  const [formData, setFormData] = useState<UserData>(initialData || {
    userName: '',
    partnerName: '',
    lastPeriodDate: new Date().toISOString().split('T')[0],
    cycleLength: 28,
    periodLength: 5,
  });

  return (
    <div className="min-h-screen bg-border-subtle flex flex-col justify-center items-center p-6 text-[#333]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 space-y-10 border border-white/50 relative overflow-hidden"
      >
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-accent opacity-5 rounded-full blur-2xl" />
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="absolute top-6 left-6 text-[#A8A293] hover:text-accent transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="text-center space-y-4 relative z-10">
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Heart className="text-accent w-10 h-10 italic" />
          </div>
          <h1 className="text-4xl font-serif italic font-light tracking-tight text-[#2D2D2D]">
            {initialData ? 'Editar Perfil' : 'Compañero Consciente'}
          </h1>
          <p className="text-[10px] text-[#A8A293] font-bold uppercase tracking-[0.3em]">
            {initialData ? 'Ajusta tu configuración' : 'Cuidar es un arte'}
          </p>
        </div>

        <div className="space-y-6 relative z-10 font-sans">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A8A293] ml-1">Tu Nombre</label>
              <input 
                type="text" 
                value={formData.userName}
                onChange={e => setFormData({...formData, userName: e.target.value})}
                placeholder="Ej: Rafael"
                className="w-full p-5 rounded-2xl border border-border-subtle bg-bg-ivory/50 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A8A293] ml-1">Nombre de tu Pareja</label>
              <input 
                type="text" 
                value={formData.partnerName}
                onChange={e => setFormData({...formData, partnerName: e.target.value})}
                placeholder="Ej: Elena"
                className="w-full p-5 rounded-2xl border border-border-subtle bg-bg-ivory/50 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all placeholder:text-gray-300"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A8A293] ml-1">Última Menstruación</label>
            <input 
              type="date" 
              value={formData.lastPeriodDate}
              onChange={e => setFormData({...formData, lastPeriodDate: e.target.value})}
              className="w-full p-5 rounded-2xl border border-border-subtle bg-bg-ivory/50 focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A8A293] ml-1">Ciclo (Días)</label>
              <input 
                type="number" 
                min="21" max="35"
                value={formData.cycleLength}
                onChange={e => setFormData({...formData, cycleLength: parseInt(e.target.value)})}
                className="w-full p-5 rounded-2xl border border-border-subtle bg-bg-ivory/50 outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A8A293] ml-1">Regla (Días)</label>
              <input 
                type="number" 
                min="2" max="10"
                value={formData.periodLength}
                onChange={e => setFormData({...formData, periodLength: parseInt(e.target.value)})}
                className="w-full p-5 rounded-2xl border border-border-subtle bg-bg-ivory/50 outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave(formData)}
          className="w-full bg-accent text-white p-6 rounded-[2rem] font-bold text-sm uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group"
        >
          <span className="relative z-10">Iniciar Camino</span>
          <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
}

function MainView({ data, resetData }: { data: UserData, resetData: () => void }) {
  const [activeTab, setActiveTab] = useState<'hoy' | 'ciclo' | 'proximo' | 'guia'>('hoy');
  const [viewDate, setViewDate] = useState(new Date());

  const currentDay = useMemo(() => getCycleDay(data.lastPeriodDate, data.cycleLength), [data]);
  const currentPhase = useMemo(() => getPhaseForDay(currentDay, data.cycleLength), [currentDay, data]);

  const tabs = [
    { id: 'hoy', icon: '🏠', label: 'Hoy' },
    { id: 'ciclo', icon: '📅', label: 'Ciclo' },
    { id: 'proximo', icon: '⏭️', label: 'Timeline' },
    { id: 'guia', icon: '💡', label: 'Guía' },
  ];

  return (
    <div className="min-h-screen bg-white shadow-2xl relative overflow-hidden flex flex-col max-w-5xl mx-auto border-x border-border-subtle">
      {/* Decorative Blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-64 h-64 bg-accent opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 left-[-50px] w-48 h-48 bg-[#6B8F71] opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="pt-10 px-8 pb-6 flex justify-between items-end border-b border-border-subtle bg-white relative z-10">
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#A8A293] mb-2">Acompañante Consciente</p>
          <h1 className="text-3xl md:text-4xl font-serif font-light leading-tight">
            Hola, {data.userName}. Hoy {data.partnerName} está en su <span className="text-accent font-semibold italic">{currentPhase.name}</span>
          </h1>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-3xl font-serif font-light">
            Día <span className="font-semibold">{currentDay}</span> <span className="text-xl opacity-50">de {data.cycleLength}</span>
          </p>
          <p className="text-[10px] text-[#A8A293] uppercase tracking-[0.15em] font-bold">{currentPhase.poeticName}</p>
        </div>
        <button onClick={resetData} className="sm:hidden absolute top-4 right-4 p-2 text-gray-300 hover:text-accent">
          <Settings size={18} />
        </button>
      </header>

      <main className="flex-1 p-6 md:p-8 relative z-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'hoy' && (
            <motion.div
              key="hoy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8"
            >
              {/* Left Column: Narrative */}
              <div className="md:col-span-5 flex flex-col gap-6">
                <div className="p-8 bg-bg-ivory rounded-[2.5rem] border border-border-subtle flex-1 card-shadow">
                  <h2 className="text-xl font-serif italic mb-6 border-b border-border-subtle pb-3 text-[#555]">Hoy ella probablemente...</h2>
                  <p className="text-[#444] leading-relaxed italic text-lg lg:text-xl font-serif">
                    "{currentPhase.description}"
                  </p>
                  
                  <div className="mt-10 flex items-center gap-5 p-5 bg-white rounded-3xl border border-border-subtle card-shadow">
                    <div className="w-14 h-14 flex items-center justify-center rounded-full bg-accent text-white text-2xl shadow-lg shadow-accent/20 shrink-0">🎁</div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#A8A293] mb-1">Gesto del día</p>
                      <p className="text-sm font-medium leading-snug">{currentPhase.gesture}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Dimensions */}
              <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-min">
                <DimensionCard Artistic icon="🩸" title="Estado Físico" content={currentPhase.physical} />
                <DimensionCard Artistic icon="🧠" title="Emocional" content={currentPhase.emotional} />
                <DimensionCard Artistic icon="💞" title="Intimidad" content={currentPhase.intimacy} />
                <DimensionCard Artistic icon="🌿" title="Apetito" content={currentPhase.cravings} />
                <div className="sm:col-span-2 p-6 bg-white border border-border-subtle rounded-[2rem] flex items-start gap-5 card-shadow">
                  <span className="text-3xl">💬</span>
                  <div>
                    <p className="font-serif italic font-semibold text-lg mb-1 leading-none">Cómo comunicarte</p>
                    <p className="text-sm text-[#666] leading-relaxed italic">"{currentPhase.communication}"</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ciclo' && <CalendarView data={data} />}
          {activeTab === 'proximo' && <UpcomingView data={data} />}
          {activeTab === 'guia' && <GuideView partnerName={data.partnerName} />}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="h-20 bg-white border-t border-border-subtle grid grid-cols-4 relative z-20">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center gap-1 transition-all relative ${
              activeTab === tab.id 
                ? 'text-accent' 
                : 'text-[#A8A293] hover:text-accent/70'
            }`}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-active"
                className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-accent"
              />
            )}
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] uppercase font-bold tracking-[0.15em]">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Settings overlay toggle for desktop */}
      <button 
        onClick={resetData} 
        className="hidden sm:flex absolute bottom-4 right-4 p-3 bg-white/50 backdrop-blur-sm rounded-full text-gray-400 hover:text-accent hover:rotate-90 transition-all z-30"
      >
        <Settings size={16} />
      </button>
    </div>
  );
}

function DimensionCard({ title, content, icon, Artistic }: { title: string, content: string, icon: React.ReactNode, Artistic?: boolean }) {
  if (Artistic) {
    return (
      <div className="p-6 bg-white border border-border-subtle rounded-[2rem] flex items-start gap-5 card-shadow transition-transform hover:scale-[1.02]">
        <span className="text-3xl shrink-0">{icon}</span>
        <div>
          <p className="font-serif italic font-semibold text-lg mb-1 leading-none">{title}</p>
          <p className="text-xs text-[#777] leading-tight">{content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-start">
      <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{title}</h3>
        <p className="text-sm text-gray-700 leading-snug">{content}</p>
      </div>
    </div>
  );
}

function CalendarView({ data }: { data: UserData }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ day: number, dayInfo: { trueCycleDay: number, phase: PhaseInfo } } | null>(null);

  const getDaysInMonth = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return d.getDate();
  };

  const getDayInfo = (day: number) => {
    const targetDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const lastDate = new Date(data.lastPeriodDate);
    const diffTime = targetDate.getTime() - lastDate.getTime();
    let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const trueCycleDay = ((diffDays % data.cycleLength) + data.cycleLength) % data.cycleLength + 1;
    const phase = getPhaseForDay(trueCycleDay, data.cycleLength);
    
    return { trueCycleDay, phase };
  };

  const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1);
  const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F5E6D3]">
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-xl font-serif font-bold text-[#2D2D2D]">
            {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
          <div>D</div><div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array(startDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const info = getDayInfo(day);
            return (
              <div 
                key={day} 
                onClick={() => setSelectedDayInfo({ day, dayInfo: info })}
                className="aspect-square flex items-center justify-center relative group cursor-pointer"
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110"
                  style={{ backgroundColor: info.phase.color + '20', color: info.phase.color }}
                >
                  {day}
                </div>
                <div className="absolute bottom-1 w-1 h-1 rounded-full" style={{ backgroundColor: info.phase.color }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Card */}
      <AnimatePresence>
        {selectedDayInfo && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg relative bg-linear-to-b from-white to-gray-50"
          >
            <button 
              onClick={() => setSelectedDayInfo(null)}
              className="absolute top-4 right-4 text-gray-400 p-1"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: selectedDayInfo.dayInfo.phase.color }} />
              <h4 className="font-serif font-bold text-lg" style={{ color: selectedDayInfo.dayInfo.phase.color }}>
                Día {selectedDayInfo.day}: {selectedDayInfo.dayInfo.phase.name}
              </h4>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Día {selectedDayInfo.dayInfo.trueCycleDay} del Ciclo</p>
            <p className="text-sm text-gray-700 leading-relaxed italic mb-4">"{selectedDayInfo.dayInfo.phase.description}"</p>
            
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <Gift size={16} className="mt-0.5 text-amber-500 shrink-0" />
                <p className="text-sm"><strong>Gesto:</strong> {selectedDayInfo.dayInfo.phase.gesture}</p>
              </div>
              <div className="flex gap-3 items-start">
                <MessageCircle size={16} className="mt-0.5 text-blue-500 shrink-0" />
                <p className="text-sm"><strong>Comunicación:</strong> {selectedDayInfo.dayInfo.phase.communication}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 grid grid-cols-2 gap-4">
        {PHASES.map(p => (
          <div key={p.id} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${p.bgColor}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{p.name}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function UpcomingView({ data }: { data: UserData }) {
  const events = useMemo(() => {
    const list = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      const lastDate = new Date(data.lastPeriodDate);
      const diffTime = futureDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const cycleDay = (diffDays % data.cycleLength) + 1;
      
      if (cycleDay === 1) {
        list.push({ day: i, label: 'Inicio de la Regla', icon: '☕', color: '#8B2E4B' });
      }
      if (cycleDay === 14) {
        list.push({ day: i, label: `Pico de Ovulación de ${data.partnerName}`, icon: '✨', color: '#C4973A' });
      }
      if (cycleDay === 23) {
        list.push({ day: i, label: 'Inicio de Fase Premenstrual', icon: '💬', color: '#7B6B9E' });
      }
    }
    return list;
  }, [data]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="space-y-10 py-4"
    >
      <header className="px-2">
        <h2 className="text-3xl font-serif italic text-[#2D2D2D] mb-2">Próximos eventos</h2>
        <p className="text-[10px] uppercase font-bold text-[#A8A293] tracking-[0.2em]">Anticípate para ser su mejor refugio</p>
      </header>

      <div className="space-y-6">
        {events.map((e, idx) => (
          <div key={idx} className="flex gap-8 items-center group">
            <div className="w-20 flex-shrink-0 text-center">
              <span className="text-[10px] font-bold text-[#A8A293] block uppercase tracking-widest mb-1">En {e.day} días</span>
              <div className="w-1 h-8 bg-border-subtle mx-auto rounded-full" />
            </div>
            <div className="flex-grow bg-white p-6 rounded-[2rem] border border-border-subtle flex items-center gap-6 shadow-sm hover:shadow-lg transition-all card-shadow">
              <div className="w-14 h-14 flex items-center justify-center bg-bg-ivory rounded-2xl text-2xl shadow-inner shrink-0">
                {e.icon}
              </div>
              <p className="text-lg font-serif font-semibold text-[#444]">{e.label}</p>
              <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function GuideView({ partnerName }: { partnerName: string }) {
  const sections = [
    {
      title: "Errores Comunes",
      subtitle: "Lo que debemos evitar",
      items: [
        "Preguntar '¿Estás con la regla?' en tono de queja.",
        "Intentar 'arreglar' sus emociones en lugar de validarlas.",
        "Ignorar su dolor físico o fatiga como si no fuera real.",
        "Tomar su necesidad de distancia como un rechazo personal.",
        "Ignorar la carga mental cuando ella tiene menos energía."
      ]
    },
    {
      title: "Palabras que Sanan",
      subtitle: "Para conectar profundamente",
      items: [
        `"Veo que hoy ha sido un día intenso, yo me encargo de todo."`,
        `"Tus sentimientos son válidos y estoy aquí para escucharte."`,
        `"¿Qué pequeño gesto te haría sentir más cuidada cada día?"`,
        `"Me encanta verte brillar así, irradias una energía especial."`,
        `"No necesitas explicar nada, solo descansa y déjate cuidar."`
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="space-y-12 py-4"
    >
      <header className="px-2 text-center">
        <h2 className="text-4xl font-serif italic text-[#2D2D2D] mb-2">Compañero Consciente</h2>
        <p className="text-[10px] uppercase font-bold text-[#A8A293] tracking-[0.2em]">Manual de conexión con {partnerName}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((sec, idx) => (
          <section key={idx} className="bg-bg-ivory rounded-[2.5rem] p-10 border border-border-subtle card-shadow">
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-2">{sec.subtitle}</p>
            <h3 className="text-3xl font-serif italic font-light mb-8 text-[#2D2D2D] border-b border-border-subtle pb-4">{sec.title}</h3>
            <ul className="space-y-6">
              {sec.items.map((item, i) => (
                <li key={i} className="flex gap-4 text-base font-serif text-[#555] leading-relaxed">
                  <span className="text-accent italic font-semibold">0{i+1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="p-12 bg-accent/5 rounded-[3rem] border border-accent/10 text-center card-shadow relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-accent/30" />
        <h3 className="text-2xl font-serif italic font-bold mb-4 text-accent">La Esencia</h3>
        <p className="text-xl font-serif text-[#666] leading-relaxed max-w-2xl mx-auto italic">
          "El ciclo no es un proceso que debamos 'gestionar', sino una naturaleza que debemos honrar. Tu papel no es ser su guía, sino su puerto seguro."
        </p>
      </div>
    </motion.div>
  );
}

// --- App Entry ---

export default function App() {
  const [data, setData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('partner_tracker_data');
    if (saved) {
      setData(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const handleSave = (newData: UserData) => {
    localStorage.setItem('partner_tracker_data', JSON.stringify(newData));
    setData(newData);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (loading) return null;

  return (
    <div className="font-sans">
      {!data || isEditing ? (
        <SetupView 
          onSave={handleSave} 
          initialData={data || undefined} 
          onCancel={data ? () => setIsEditing(false) : undefined} 
        />
      ) : (
        <MainView data={data} resetData={handleEdit} />
      )}
    </div>
  );
}

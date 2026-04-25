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
  directMessage: string;
  color: string;
  bgColor: string;
  physical: string;
  emotional: string;
  intimacy: string;
  cravings: string;
  communication: string;
  gesture: string;
  desireLevel: number; // 1-10
  range: [number, number];
}

const PHASES: PhaseInfo[] = [
  {
    id: 'menstrual',
    name: 'Fase Menstrual',
    directMessage: 'Está perdiendo mucha sangre y energía. Necesita descanso total y calor.',
    color: '#EA4335', // Google Red
    bgColor: 'bg-google-red',
    physical: 'Dolor abdominal, fatiga extrema, sensibilidad al frío.',
    emotional: 'Sensible, introvertida, necesita calma.',
    intimacy: 'Deseo bajo. Prioriza mimos sin contacto sexual.',
    cravings: 'Chocolate negro, sopas calientes, alimentos con hierro.',
    communication: 'No le pidas decisiones importantes. Escucha y valida.',
    gesture: 'Prepárale una manta caliente o su comida reconfortante.',
    desireLevel: 2,
    range: [1, 5]
  },
  {
    id: 'folicular',
    name: 'Fase Folicular',
    directMessage: 'Su energía está subiendo. Está más abierta a planes, socializar y novedad.',
    color: '#34A853', // Google Green
    bgColor: 'bg-google-green',
    physical: 'Energía alta, piel radiante, se siente ligera.',
    emotional: 'Optimista, creativa, con ganas de hacer cosas.',
    intimacy: 'Deseo subiendo. Toma la iniciativa para planes divertidos.',
    cravings: 'Comidas frescas, ensaladas, platos ligeros.',
    communication: 'Ideal para planificar proyectos o viajes juntos.',
    gesture: 'Propón una actividad nueva o una salida espontánea.',
    desireLevel: 7,
    range: [6, 13]
  },
  {
    id: 'ovulatoria',
    name: 'Fase Ovulatoria (Pico)',
    directMessage: 'Es su momento de máxima vitalidad. Se siente magnética y con mucho deseo sexual.',
    color: '#FBBC05', // Google Yellow
    bgColor: 'bg-google-yellow',
    physical: 'Energía máxima. Se siente muy atractiva y fuerte.',
    emotional: 'Segura de sí misma, sociable y carismática.',
    intimacy: 'PICO DE DESEO. Momento de mayor conexión física e intensidad.',
    cravings: 'Comidas saludables y elegantes. Apetito moderado.',
    communication: 'Comunícale lo mucho que la admiras y deséala.',
    gesture: 'Cena especial o tiempo de calidad exclusivo para ambos.',
    desireLevel: 10,
    range: [14, 16]
  },
  {
    id: 'lutea_temprana',
    name: 'Fase Lútea',
    directMessage: 'La energía baja. Busca más el nido, la tranquilidad y el orden en casa.',
    color: '#4285F4', // Google Blue
    bgColor: 'bg-google-blue',
    physical: 'Bajada de energía progresiva. Empieza a hincharse.',
    emotional: 'Reflexiva, busca seguridad y confort doméstico.',
    intimacy: 'Deseo moderado. Busca más la ternura y la cercanía emocional.',
    cravings: 'Alimentos calóricos, antojos salados, picoteo.',
    communication: 'Habla de temas de hogar y estabilidad. Sé suave.',
    gesture: 'Ayuda con las tareas de casa sin que te lo pida.',
    desireLevel: 5,
    range: [17, 22]
  },
  {
    id: 'premenstrual',
    name: 'Fase Premenstrual',
    directMessage: 'Días críticos. Está muy sensible y puede estar irritable. Paciencia máxima.',
    color: '#5F6368', // Google Gray
    bgColor: 'bg-google-gray',
    physical: 'Hinchazón, dolor de pechos, posible dolor de cabeza.',
    emotional: 'Vulnerable, sensible a la crítica, necesita validación.',
    intimacy: 'Deseo bajo. Evita presiones. Dale espacio y afecto.',
    cravings: 'Antojos intensos de dulce. Hambre emocional.',
    communication: 'EVITA críticas. Dile: "Te entiendo" y "Aquí estoy".',
    gesture: 'Palabras de afirmación. Recuérdale que es maravillosa.',
    desireLevel: 3,
    range: [23, 28]
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
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 sm:p-12 space-y-8 border border-[#E8EAED] relative"
      >
        {onCancel && (
          <button 
            onClick={onCancel}
            className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 text-google-gray transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-google-blue rounded-[1.2rem] flex items-center justify-center shadow-lg transform rotate-6">
              <Heart className="text-white w-8 h-8 fill-white" />
            </div>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#202124]">
            {initialData ? 'Configuración' : 'Compañero Consciente'}
          </h1>
          <p className="text-sm text-google-gray font-normal">
            {initialData ? 'Actualiza los datos de seguimiento' : 'Información clave para acompañar mejor'}
          </p>
        </div>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5 focus-within:text-google-blue transition-colors">
              <label className="text-xs font-semibold text-google-gray ml-1">Tu nombre</label>
              <input 
                type="text" 
                value={formData.userName}
                onChange={e => setFormData({...formData, userName: e.target.value})}
                placeholder="Rafael"
                className="w-full px-4 py-3 rounded-lg border border-[#DADCE0] bg-white focus:border-google-blue focus:ring-1 focus:ring-google-blue outline-none transition-all placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1.5 focus-within:text-google-blue transition-colors">
              <label className="text-xs font-semibold text-google-gray ml-1">Su nombre</label>
              <input 
                type="text" 
                value={formData.partnerName}
                onChange={e => setFormData({...formData, partnerName: e.target.value})}
                placeholder="Elena"
                className="w-full px-4 py-3 rounded-lg border border-[#DADCE0] bg-white focus:border-google-blue focus:ring-1 focus:ring-google-blue outline-none transition-all placeholder:text-gray-400"
              />
            </div>
          </div>
          
          <div className="space-y-1.5 focus-within:text-google-blue transition-colors">
            <label className="text-xs font-semibold text-google-gray ml-1">Fecha inicio última regla</label>
            <input 
              type="date" 
              value={formData.lastPeriodDate}
              onChange={e => setFormData({...formData, lastPeriodDate: e.target.value})}
              className="w-full px-4 py-3 rounded-lg border border-[#DADCE0] bg-white focus:border-google-blue focus:ring-1 focus:ring-google-blue outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5 focus-within:text-google-blue transition-colors">
              <label className="text-xs font-semibold text-google-gray ml-1">Días de ciclo</label>
              <input 
                type="number" 
                min="21" max="35"
                value={formData.cycleLength}
                onChange={e => setFormData({...formData, cycleLength: parseInt(e.target.value)})}
                className="w-full px-4 py-3 rounded-lg border border-[#DADCE0] focus:border-google-blue outline-none"
              />
            </div>
            <div className="space-y-1.5 focus-within:text-google-blue transition-colors">
              <label className="text-xs font-semibold text-google-gray ml-1">Días de regla</label>
              <input 
                type="number" 
                min="2" max="10"
                value={formData.periodLength}
                onChange={e => setFormData({...formData, periodLength: parseInt(e.target.value)})}
                className="w-full px-4 py-3 rounded-lg border border-[#DADCE0] focus:border-google-blue outline-none"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave(formData)}
          className="google-button google-button-primary w-full py-4 text-base tracking-wide mt-4"
        >
          {initialData ? 'Guardar Cambios' : 'Empezar ahora'}
        </button>
      </motion.div>
    </div>
  );
}

function MainView({ data, resetData }: { data: UserData, resetData: () => void }) {
  const [activeTab, setActiveTab] = useState<'hoy' | 'ciclo' | 'proximo' | 'guia'>('hoy');

  const currentDay = useMemo(() => getCycleDay(data.lastPeriodDate, data.cycleLength), [data]);
  const currentPhase = useMemo(() => getPhaseForDay(currentDay, data.cycleLength), [currentDay, data]);

  const tabs = [
    { id: 'hoy', icon: <Sparkles size={20} />, label: 'Hoy' },
    { id: 'ciclo', icon: <Calendar size={20} />, label: 'Ciclo' },
    { id: 'proximo', icon: <Activity size={20} />, label: 'Eventos' },
    { id: 'guia', icon: <BookOpen size={20} />, label: 'Guía' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col max-w-2xl mx-auto shadow-2xl relative">
      {/* Google Style Header */}
      <header className="bg-white border-b border-[#E8EAED] sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-google-blue rounded-lg flex items-center justify-center shadow-sm">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-[#202124] leading-tight">Compañero Consciente</h1>
            <p className="text-xs text-google-gray">Acompañando a <span className="font-semibold">{data.partnerName}</span></p>
          </div>
        </div>
        <button onClick={resetData} className="p-2 rounded-full hover:bg-gray-100 text-google-gray transition-colors">
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto pb-24">
        {/* Day Indicator Card */}
        <div className="mb-6 p-6 bg-white rounded-2xl border border-[#E8EAED] shadow-sm overflow-hidden relative">
          <div className={`absolute top-0 left-0 w-1.5 h-full ${currentPhase.bgColor}`} />
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white mb-2 ${currentPhase.bgColor}`}>
                {currentPhase.name}
              </span>
              <h2 className="text-2xl font-medium text-[#202124]">Día {currentDay} del ciclo</h2>
            </div>
          </div>
          <p className="text-[#3C4043] text-lg font-normal leading-relaxed border-l-4 border-[#E8EAED] pl-4 italic">
            "{currentPhase.directMessage}"
          </p>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'hoy' && (
            <motion.div
              key="hoy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Sexual Desire Indicator */}
              <div className="p-6 bg-white rounded-2xl border border-[#E8EAED] shadow-sm flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold text-google-gray uppercase tracking-wider">Deseo Sexual Probable</span>
                    <span className="text-2xl font-bold text-google-blue">{currentPhase.desireLevel*10}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all duration-1000 ${currentPhase.desireLevel > 7 ? 'bg-google-yellow' : 'bg-google-blue'}`}
                      style={{ width: `${currentPhase.desireLevel * 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-google-gray mt-2 font-medium">
                    {currentPhase.desireLevel >= 8 ? '🔥 Momento de alta receptividad. Ten iniciativa.' : 
                     currentPhase.desireLevel >= 5 ? '😊 Receptiva a la ternura y conexión suave.' : 
                     '💤 Baja energía sexual. Prioriza el cuidado emocional.'}
                  </p>
                </div>
              </div>

              {/* Grid of Dimensions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DimensionCard icon={<Activity className="text-google-red" size={20} />} title="Estado Físico" content={currentPhase.physical} />
                <DimensionCard icon={<Brain className="text-google-blue" size={20} />} title="Mental / Emocional" content={currentPhase.emotional} />
                <DimensionCard icon={<Heart className="text-google-red" size={20} />} title="Intimidad & Sexo" content={currentPhase.intimacy} />
                <DimensionCard icon={<UtensilsCrossed className="text-google-green" size={20} />} title="Alimentación" content={currentPhase.cravings} />
              </div>

              {/* Communication Card */}
              <div className="p-6 bg-white border border-[#E8EAED] rounded-2xl flex items-start gap-5 shadow-sm">
                <div className="w-12 h-12 bg-google-blue/10 rounded-xl flex items-center justify-center shrink-0">
                  <MessageCircle className="text-google-blue" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-google-blue mb-1">Clave de comunicación</h3>
                  <p className="text-sm text-google-gray leading-relaxed font-medium">"{currentPhase.communication}"</p>
                </div>
              </div>

              {/* Gesture Card */}
              <div className="p-6 bg-google-blue text-white rounded-2xl flex items-start gap-5 shadow-lg shadow-google-blue/20">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="font-bold mb-1">El gesto de hoy</h3>
                  <p className="text-sm text-white/90 leading-relaxed font-medium">{currentPhase.gesture}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ciclo' && <CalendarView data={data} />}
          {activeTab === 'proximo' && <UpcomingView data={data} />}
          {activeTab === 'guia' && <GuideView partnerName={data.partnerName} />}
        </AnimatePresence>
      </main>

      {/* Navigation - Google Style */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto h-20 bg-white border-t border-[#E8EAED] grid grid-cols-4 z-40 px-2 pb-safe">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center gap-1.5 transition-all transition-colors ${
              activeTab === tab.id 
                ? 'text-google-blue' 
                : 'text-google-gray hover:text-google-blue/70'
            }`}
          >
            <div className={`p-1.5 rounded-full px-5 transition-all ${activeTab === tab.id ? 'bg-google-blue/10' : ''}`}>
              {tab.icon}
            </div>
            <span className={`text-[11px] font-medium tracking-tight ${activeTab === tab.id ? 'opacity-100' : 'opacity-80'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function DimensionCard({ title, content, icon }: { title: string, content: string, icon: React.ReactNode }) {
  return (
    <div className="p-5 bg-white border border-[#E8EAED] rounded-2xl shadow-sm transition-all hover:bg-gray-50 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg">{icon}</div>
        <p className="font-semibold text-sm text-[#202124]">{title}</p>
      </div>
      <p className="text-xs text-google-gray leading-relaxed font-medium">{content}</p>
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
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8EAED]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#202124] capitalize">
            {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-1">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-full text-google-gray transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-full text-google-gray transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-google-gray uppercase tracking-tighter mb-4 opacity-70">
          <div>Dom</div><div>Lun</div><div>Mar</div><div>Mie</div><div>Jue</div><div>Vie</div><div>Sab</div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array(startDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map(day => {
            const info = getDayInfo(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth.getMonth();
            
            return (
              <button 
                key={day} 
                onClick={() => setSelectedDayInfo({ day, dayInfo: info })}
                className={`aspect-square flex items-center justify-center relative rounded-full transition-all hover:bg-gray-50 group ${isToday ? 'ring-2 ring-google-blue ring-offset-2' : ''}`}
              >
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: info.phase.id === 'menstrual' || info.phase.id === 'ovulatoria' ? info.phase.color + '15' : 'transparent' }}
                >
                  <span style={{ color: info.phase.id === 'menstrual' || info.phase.id === 'ovulatoria' ? info.phase.color : '#3C4043' }}>
                    {day}
                  </span>
                </div>
                {info.phase.id === 'ovulatoria' && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-google-yellow rounded-full animate-pulse" />
                )}
                <div className="absolute bottom-1 w-1 h-1 rounded-full" style={{ backgroundColor: info.phase.color }} />
              </button>
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
            className="bg-white rounded-2xl p-6 border border-[#E8EAED] shadow-lg relative"
          >
            <button 
              onClick={() => setSelectedDayInfo(null)}
              className="absolute top-4 right-4 text-google-gray p-2 hover:bg-gray-100 rounded-full"
            >
              <Settings size={16} className="rotate-45" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedDayInfo.dayInfo.phase.color }} />
              <h4 className="font-semibold text-lg text-[#202124]">
                Día {selectedDayInfo.day} - {selectedDayInfo.dayInfo.phase.name}
              </h4>
            </div>
            <p className="text-sm font-semibold text-google-gray mb-3 italic">
              "{selectedDayInfo.dayInfo.phase.directMessage}"
            </p>
            
            <div className="grid grid-cols-1 gap-4 pt-2">
              <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                <Sparkles size={18} className="text-google-blue shrink-0" />
                <p className="text-xs font-medium text-google-gray"><strong>Gesto:</strong> {selectedDayInfo.dayInfo.phase.gesture}</p>
              </div>
              <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                <Heart size={18} className="text-google-red shrink-0" />
                <p className="text-xs font-medium text-google-gray"><strong>Deseo:</strong> {selectedDayInfo.dayInfo.phase.desireLevel*10}% receptividad</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="bg-white p-5 rounded-2xl border border-[#E8EAED] grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PHASES.map(p => (
          <div key={p.id} className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${p.bgColor}`} />
            <span className="text-[10px] font-semibold text-google-gray">{p.name}</span>
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
        list.push({ day: i, label: `Inicio de Regla de ${data.partnerName}`, icon: <Activity className="text-google-red" />, type: 'critical' });
      }
      if (cycleDay === 14) {
        list.push({ day: i, label: 'Pico de Deseo Sexual (Ovulación)', icon: <Heart className="text-google-yellow fill-google-yellow" />, type: 'peak' });
      }
      if (cycleDay === 23) {
        list.push({ day: i, label: 'Inicio Fase Crítica (Premenstrual)', icon: <Brain className="text-google-gray" />, type: 'alert' });
      }
    }
    return list;
  }, [data]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="px-1">
        <h2 className="text-2xl font-medium text-[#202124] mb-2">Próximos eventos</h2>
        <p className="text-sm text-google-gray">Previsión para los próximos 30 días</p>
      </div>

      <div className="space-y-3">
        {events.map((e, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E8EAED] flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
              {e.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#202124]">{e.label}</p>
              <p className="text-xs text-google-gray">En {e.day} días</p>
            </div>
            {e.type === 'peak' && (
              <span className="px-2 py-1 bg-google-yellow/10 text-google-yellow text-[10px] font-bold rounded uppercase tracking-wide">Pico</span>
            )}
          </div>
        ))}
        {events.length === 0 && (
          <div className="p-12 text-center text-google-gray border-2 border-dashed border-gray-200 rounded-2xl">
            No hay eventos críticos próximamente.
          </div>
        )}
      </div>
    </motion.div>
  );
}

function GuideView({ partnerName }: { partnerName: string }) {
  const sections = [
    {
      title: "Protocolo de Acción",
      items: [
        "Evita preguntar si 'está con la regla' en medio de una discusión.",
        "Si está irritable, no lo tomes personal. Su cuerpo está bajo mucha presión hormonal.",
        "Valida sus emociones antes de proponer cualquier solución técnica.",
        "Ten iniciativa en las tareas del hogar cuando ella tenga menos energía.",
        "Respeta sus silencios y su necesidad de distanciarse sin sentirte rechazado."
      ]
    },
    {
      title: "Mensajes Directos",
      items: [
        `"Hoy yo me encargo de la cena y de todo en casa, tú descansa."`,
        `"Veo que estás cansada, ¿quieres que te traiga algo caliente?"`,
        `"Entiendo que te sientas así, es normal y estoy aquí contigo."`,
        `"Estás guapísima hoy, me encanta verte así de radiante."`,
        `"No tienes que explicar nada, solo di qué necesitas de mí."`
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center px-4">
        <h2 className="text-3xl font-medium text-[#202124] mb-2 font-serif italic tracking-tight">Manual del Compañero</h2>
        <p className="text-sm text-google-gray">Directrices para una mejor conexión con {partnerName}</p>
      </div>

      <div className="space-y-6">
        {sections.map((sec, idx) => (
          <section key={idx} className="bg-white rounded-2xl p-8 border border-[#E8EAED] shadow-sm">
            <h3 className="text-xl font-semibold mb-6 text-google-blue border-b border-gray-100 pb-3">{sec.title}</h3>
            <ul className="space-y-4">
              {sec.items.map((item, i) => (
                <li key={i} className="flex gap-4 items-start text-sm text-[#3C4043] font-medium leading-relaxed">
                  <div className="w-5 h-5 bg-google-blue/10 rounded-full flex items-center justify-center text-google-blue text-[10px] font-bold shrink-0 mt-0.5">
                    {i+1}
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="p-8 bg-google-blue text-white rounded-3xl shadow-xl shadow-google-blue/20 text-center">
        <h3 className="text-lg font-bold mb-2">Principio Fundamental</h3>
        <p className="text-sm text-white/90 leading-relaxed font-medium italic">
          "Tu papel no es entender el ciclo a nivel biológico perfecto, sino ser el lugar seguro donde ella pueda transitarlo sin juicio."
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

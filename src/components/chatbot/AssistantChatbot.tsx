import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { UrbanZone, SimulationScenario } from '../../types';
import { 
  Bot, 
  Sparkles, 
  Send, 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Compass, 
  Activity, 
  Boxes, 
  Cpu, 
  Trees, 
  Award, 
  FileSpreadsheet, 
  FileText, 
  FileCode, 
  Check, 
  ChevronRight, 
  HelpCircle, 
  ShieldCheck, 
  Leaf, 
  Flame, 
  Wind, 
  Droplets, 
  Zap, 
  Building2, 
  MapPin, 
  Info,
  Sliders,
  ExternalLink,
  MessageSquareCode,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Square
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  quickActions?: {
    label: string;
    actionType: 'navigate' | 'export' | 'select_zone' | 'trigger_guided' | 'apply_nbs';
    target?: string;
    param?: any;
    icon?: string;
  }[];
  category?: 'general' | 'guided_tour' | 'nbs_assistant' | 'iot_calibration' | 'ai_models' | 'reports' | 'regulations';
}

interface AssistantChatbotProps {
  currentModule: string;
  onNavigateModule: (moduleKey: any) => void;
  zones: UrbanZone[];
  selectedZone: UrbanZone;
  onSelectZone: (zone: UrbanZone) => void;
  onExport: (format: 'xlsx' | 'pdf' | 'docx' | 'csv', scenario?: SimulationScenario) => void;
  activeScenario: SimulationScenario | null;
  isOpenControlled?: boolean;
  onToggleControlled?: (open: boolean) => void;
}

export const AssistantChatbot: React.FC<AssistantChatbotProps> = ({
  currentModule,
  onNavigateModule,
  zones,
  selectedZone,
  onSelectZone,
  onExport,
  activeScenario,
  isOpenControlled,
  onToggleControlled
}) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onToggleControlled) onToggleControlled(open);
    else setInternalIsOpen(open);
  };
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [assistantTone, setAssistantTone] = useState<'cientifico' | 'municipal' | 'didactico'>('cientifico');
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [activeGuidedMode, setActiveGuidedMode] = useState<string | null>(null);

  // Voice Interaction State (Speech Recognition & Speech Synthesis)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [voiceStatusText, setVoiceStatusText] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to clean Markdown and emojis for natural Text-to-Speech
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
      .replace(/\*(.*?)\*/g, '$1') // remove italic
      .replace(/\$\$(.*?)\$\$/g, 'fórmula') // math block
      .replace(/\$(.*?)\$/g, '$1') // inline math
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // links
      .replace(/[#_`~>]/g, '') // markdown symbols
      .replace(/[^\w\s.,;:áéíóúÁÉÍÓÚñÑüÜ¿?¡!()-]/g, '') // remove emojis/special chars
      .trim();
  };

  // Text-to-Speech function
  const speakText = (text: string, msgId?: string) => {
    if (!('speechSynthesis' in window)) {
      alert(t('assistant.browserNoVoice'));
      return;
    }

    // If currently speaking this message, toggle off
    if (speakingMessageId === msgId && msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-PE';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang === 'es-PE' || v.lang === 'es-ES' || v.lang.startsWith('es'));
    if (esVoice) {
      utterance.voice = esVoice;
    }

    if (msgId) {
      setSpeakingMessageId(msgId);
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMessageId(null);
  };

  // Speech-to-Text (Microphone input)
  const toggleListening = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert(t('assistant.browserNoMic'));
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setVoiceStatusText(null);
      return;
    }

    try {
      stopSpeaking();
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'es-PE';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatusText(t('assistant.listening'));
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceStatusText(t('assistant.micDenied'));
        } else {
          setVoiceStatusText(null);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceStatusText(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error al inicializar micrófono:', err);
      setIsListening(false);
      setVoiceStatusText(null);
    }
  };

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: `${t('assistant.welcome').replace('{name}', user?.name ? user.name.split(' ')[0] : t('assistant.welcomeDefaultName'))}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: [
        { label: t('assistant.quick.tour'), actionType: 'trigger_guided', target: 'tour' },
        { label: t('assistant.quick.nbs'), actionType: 'trigger_guided', target: 'nbs_guide' },
        { label: t('assistant.quick.iot'), actionType: 'trigger_guided', target: 'iot_guide' },
        { label: t('assistant.quick.compare'), actionType: 'navigate', target: 'ai_engine' },
        { label: t('assistant.quick.report'), actionType: 'navigate', target: 'reports' }
      ]
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  // Guided Assistant Option Triggers
  const startGuidedFlow = (flowKey: string) => {
    setActiveGuidedMode(flowKey);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);

      let newMsg: ChatMessage | null = null;

      if (flowKey === 'tour') {
        newMsg = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `🎯 **Tour Guiado por la Arquitectura de la Tesis**\n\nEl Gemelo Digital de Trujillo se estructura en **5 Objetivos Específicos (OE)** conforme al marco científico de la investigación:\n\n1. **OE1: Diagnóstico Microescala:** Identifica islas de calor (UHI) y puntos críticos de $PM_{2.5}$ en 6 zonas clave.\n2. **OE2: Red IoT & Calibración:** Sensores de bajo costo con calibración de 2 etapas (Zhivkov et al., 2025).\n3. **OE3: Modelos IA & Deep Learning:** Redes 1D-CNN ($R^2=0.9925$) y GNN para predicción callejera.\n4. **OE4: Simulador NbS:** Modelado de arbolado nativo (*Molle, Huarango*) y techos verdes bajo GREENPASS®.\n5. **OE5: Validación & Políticas:** Matriz de cumplimiento de tesis y ordenanzas para la MPT y OEFA.\n\n¿A qué módulo deseas que te transporte ahora?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'guided_tour',
          quickActions: [
            { label: '📍 Ver Diagnóstico (OE1)', actionType: 'navigate', target: 'diagnosis' },
            { label: '📡 Ver Arquitectura IoT (OE2)', actionType: 'navigate', target: 'architecture' },
            { label: '🧠 Ver Modelos IA (OE3)', actionType: 'navigate', target: 'ai_engine' },
            { label: '🌳 Ir al Simulador NbS (OE4)', actionType: 'navigate', target: 'nbs_simulator' },
            { label: '📊 Ver Validación & Tesis (OE5)', actionType: 'navigate', target: 'validation' }
          ]
        };
      } else if (flowKey === 'nbs_guide') {
        newMsg = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `🌳 **Asistente Guiado de Intervenciones NbS**\n\nVamos a diseñar una intervención adaptada a la microescala de Trujillo.\n\nActualmente tienes seleccionada la zona: **${selectedZone.name}**\n- Temperatura Base: **${selectedZone.baselineTemp} °C**\n- Contaminación $PM_{2.5}$: **${selectedZone.baselinePM25} µg/m³**\n- Población expuesta: **${selectedZone.targetPopulation.toLocaleString()} hab.**\n\n¿Qué problemática ambiental priorizamos mitigar en esta zona?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'nbs_assistant',
          quickActions: [
            { label: '🔥 Mitigar Calor Extremo & UHI (-3.5°C)', actionType: 'trigger_guided', target: 'nbs_heat_plan' },
            { label: '💨 Filtrar Material Particulado PM2.5 (-35%)', actionType: 'trigger_guided', target: 'nbs_pm_plan' },
            { label: '🌿 Plan Verde Integral Balanceado', actionType: 'trigger_guided', target: 'nbs_balanced_plan' },
            { label: '🏙️ Cambiar a Otra Zona Urbana', actionType: 'trigger_guided', target: 'choose_zone' }
          ]
        };
      } else if (flowKey === 'nbs_heat_plan') {
        newMsg = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `❄️ **Recomendación para Islas de Calor Extremo (UHI)**\n\nPara contrarrestar el calor urbano en **${selectedZone.name}**, el modelo **1D-CNN (Naveed 2025)** y el estándar **GREENPASS®** recomiendan:\n\n- **180 Árboles de Molle Costeño y Huarango:** Alto dosel de sombra y evapotranspiración con bajo consumo hídrico.\n- **3,200 m² de Techos Verdes Extensivos:** Reducción del flujo térmico hacia cubiertas con sustrato xerófilo (*Sedum spp.*).\n- **4,500 m² de Pavimento Permeable / Grass Paver:** Incremento del albedo superficial ($0.20 \\rightarrow 0.45$).\n\n📉 **Impacto Proyectado:**\n- Descenso Térmico: **-3.4 °C**\n- Confort Térmico PET: **Mejora de +28 puntos (TCS)**\n- Presupuesto Estimado: **S/. 1,027,000 PEN**\n\n¿Deseas abrir el simulador con estos parámetros o descargar el informe?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: [
            { label: '🚀 Cargar Parámetros en Simulador NbS', actionType: 'navigate', target: 'nbs_simulator' },
            { label: '📄 Descargar Reporte en Excel', actionType: 'export', target: 'xlsx' },
            { label: '📊 Descargar Reporte en PDF', actionType: 'export', target: 'pdf' }
          ]
        };
      } else if (flowKey === 'nbs_pm_plan') {
        newMsg = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `🍃 **Recomendación para Reducción Crítica de PM2.5**\n\nEn cañones urbanos de tráfico vehicular denso (como Av. España o Mercado Hermelinda):\n\n- **Muros Verdes Verticales (1,400 m²):** Intercepción laminar de material particulado a la altura respirable de peatones.\n- **Corredor Arbóreo Denso con Jacarandá & Tecoma stans (220 árboles):** Retención foliar de micropartículas mediante vellosidades foliares.\n- **Jardines de Lluvia con grava volcánica (950 m²):** Fijación de sedimentos y drenaje.\n\n📉 **Impacto Proyectado:**\n- Reducción de $PM_{2.5}$: **-38.6%** (De ${selectedZone.baselinePM25} a ${(selectedZone.baselinePM25 * 0.614).toFixed(1)} µg/m³)\n- Reducción de $NO_2$: **-29.4%**\n- Población protegida: **${Math.round(selectedZone.targetPopulation * 0.85).toLocaleString()} ciudadanos**`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: [
            { label: '🚀 Aplicar en Módulo NbS', actionType: 'navigate', target: 'nbs_simulator' },
            { label: '📥 Exportar Síntesis PDF', actionType: 'export', target: 'pdf' }
          ]
        };
      } else if (flowKey === 'choose_zone') {
        newMsg = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `📍 Selecciona una de las 6 zonas críticas del caso de estudio Trujillo:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: zones.map(z => ({
            label: `${z.name.split(':')[0]} (${z.baselineTemp}°C | ${z.baselinePM25}µg)`,
            actionType: 'select_zone',
            param: z
          }))
        };
      } else if (flowKey === 'iot_guide') {
        newMsg = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `📡 **Protocolo IoT y Algoritmo de Calibración en 2 Etapas (OE2)**\n\nLos sensores de bajo costo (PMS5003, Sensirion SPS30) sufren graves distorsiones por la neblina marina costera de Trujillo. Implementamos el método de **Zhivkov et al. (2025) y Cowell et al. (2023)**:\n\n1. **Etapa 1 - Corrección Higroscópica No Lineal:**\n   $$CF_{HR} = 1 + \\kappa \\cdot \\frac{HR^2}{100 - HR}$$\n   Elimina la sobrestimación por hinchamiento de partículas húmedas.\n\n2. **Etapa 2 - Compensación Térmica y Autocalentamiento:**\n   $$T_{corregida} = T_{sensor} - \\Delta T_{auto} (\\approx -0.6^\\circ C)$$\n\n📈 **Resultado Científico:** El coeficiente de correlación $R^2$ frente a la estación patrón SENAMHI se eleva de **0.29 (crudo)** a **0.94 (calibrado)**.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'iot_calibration',
          quickActions: [
            { label: '🔍 Ver Arquitectura de 3 Capas', actionType: 'navigate', target: 'architecture' },
            { label: '📊 Descargar Dataset de Telemetría CSV', actionType: 'export', target: 'csv' }
          ]
        };
      } else if (flowKey === 'regulations') {
        newMsg = {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: `⚖️ **Normativa Ambiental y Estándares de Calidad Ambiental (ECA-Aire Perú)**\n\nBajo el **D.S. N° 003-2017-MINAM** y las directrices globales de la OMS (2021):\n\n- **PM2.5 (24 Horas):** Límite Perú: **50 µg/m³** | Guía OMS: **15 µg/m³**\n  *Puntos Críticos en Trujillo:* Mercado Hermelinda (44.5 µg) y Av. España (38.2 µg) operan en umbrales de alerta.\n- **PM10 (24 Horas):** Límite Perú: **100 µg/m³** | Guía OMS: **45 µg/m³**\n- **NO2 (1 Hora):** Límite Perú: **200 µg/m³**\n- **O3 (8 Horas):** Límite Perú: **100 µg/m³**\n\nEl Gemelo Digital genera la matriz de cumplimiento normativo exigida por OEFA.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'regulations',
          quickActions: [
            { label: '📑 Ver Políticas y Ordenanzas (OE5)', actionType: 'navigate', target: 'validation' },
            { label: '📄 Descargar Informe Técnico PDF', actionType: 'export', target: 'pdf' }
          ]
        };
      }

      if (newMsg) {
        setMessages(prev => [...prev, newMsg!]);
        if (isVoiceOutputEnabled) {
          speakText(newMsg.text, newMsg.id);
        }
      }
    }, 600);
  };

  // Handle Free-Text Queries (Natural Language Knowledge Engine)
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputQuery.trim();
    if (!query) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const response = generateIntelligentResponse(query);
      setMessages(prev => [...prev, response]);
      if (isVoiceOutputEnabled) {
        speakText(response.text, response.id);
      }
    }, 700);
  };

  // Rule-based Scientific NLP matcher for Trujillo Digital Twin
  const generateIntelligentResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();

    // 1. Navigation intents
    if (q.includes('diagnostico') || q.includes('oe1') || q.includes('zonas') || q.includes('mapa')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `📍 **Módulo OE1: Diagnóstico de Microescala**\n\nEn este módulo puedes explorar la línea base ambiental de las 6 zonas de Trujillo (temperatura, $PM_{2.5}$, arbolado, población vulnerable y densidad edificada).\n\n¿Quieres que te traslade a ese módulo?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '👉 Ir a Diagnóstico Microescala', actionType: 'navigate', target: 'diagnosis' },
          { label: '📊 Ver Zonas en Excel', actionType: 'export', target: 'xlsx' }
        ]
      };
    }

    if (q.includes('sensor') || q.includes('iot') || q.includes('calibracion') || q.includes('mqtt') || q.includes('arquitectura') || q.includes('oe2')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `📡 **Módulo OE2: Arquitectura IoT y Calibración en 2 Etapas**\n\nAquí se supervisa la telemetría en tiempo real de los nodos sensores, el protocolo MQTT/REST y el algoritmo de calibración higroscópica que eleva el $R^2$ a 0.94.\n\n¿Deseas inspeccionar la red IoT?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '👉 Ir a Arquitectura IoT (OE2)', actionType: 'navigate', target: 'architecture' },
          { label: '🧪 Explicar Algoritmo de Calibración', actionType: 'trigger_guided', target: 'iot_guide' }
        ]
      };
    }

    if (q.includes('ia') || q.includes('ai') || q.includes('modelo') || q.includes('1d-cnn') || q.includes('gnn') || q.includes('deep learning') || q.includes('machine learning') || q.includes('oe3')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `🤖 **Módulo OE3: Modelos de Inteligencia Artificial & Benchmarks**\n\nComparamos 5 arquitecturas predictivas:\n- **1D-CNN (Naveed et al. 2025):** $R^2 = 0.9925$ | Inferencia: 4.8 ms (Modelo Óptimo)\n- **GNN (Zhivkov et al. 2025):** $R^2 = 0.9880$ | Basado en grafos y morfología de cañón\n- **Random Forest:** $R^2 = 0.9610$ | 300 árboles\n- **Bi-LSTM (Li et al. 2026):** $R^2 = 0.9740$ | Serie temporal\n- **XGBoost:** $R^2 = 0.9530$\n\n¿Deseas probar inferencias en vivo?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '👉 Ir al Motor de IA (OE3)', actionType: 'navigate', target: 'ai_engine' },
          { label: '📈 Ver Tabla Comparativa de Modelos', actionType: 'navigate', target: 'ai_engine' }
        ]
      };
    }

    if (q.includes('simular') || q.includes('simulador') || q.includes('nbs') || q.includes('naturaleza') || q.includes('arbol') || q.includes('techo verde') || q.includes('oe4')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `🌳 **Módulo OE4: Simulador de Microclima y NbS**\n\nPermite modificar el cañón urbano ($H/W$), viento, radiación y añadir arbolado nativo (*Schinus molle, Prosopis pallida*), techos verdes extensivos y pavimentos permeables calculando el confort GREENPASS® (PET y TCS).\n\n¿Quieres abrir el simulador?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '👉 Ir al Simulador NbS (OE4)', actionType: 'navigate', target: 'nbs_simulator' },
          { label: '🎯 Asistente Guiado de Planes NbS', actionType: 'trigger_guided', target: 'nbs_guide' }
        ]
      };
    }

    if (q.includes('reporte') || q.includes('descargar') || q.includes('excel') || q.includes('pdf') || q.includes('word') || q.includes('csv') || q.includes('exportar')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `📄 **Generador de Reportes Multiformato**\n\nPuedo exportar de inmediato los datos del Gemelo Digital en el formato que requieras:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '📗 Descargar Libro Excel (.xlsx)', actionType: 'export', target: 'xlsx' },
          { label: '📕 Descargar Informe Técnico (.pdf)', actionType: 'export', target: 'pdf' },
          { label: '📘 Descargar Manuscrito Word (.docx)', actionType: 'export', target: 'docx' },
          { label: '📊 Descargar Dataset IoT (.csv)', actionType: 'export', target: 'csv' },
          { label: '👉 Ir al Módulo de Reportes', actionType: 'navigate', target: 'reports' }
        ]
      };
    }

    if (q.includes('tesis') || q.includes('joel') || q.includes('arevalo') || q.includes('unt') || q.includes('objetivo') || q.includes('hipotesis') || q.includes('oe5')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `🎓 **Información de la Investigación de Tesis**\n\n- **Título:** *"Gemelo digital de calidad del aire a microescala y soluciones basadas en naturaleza urbana para reducir la exposición a contaminantes y calor extremo"*\n- **Investigador Principal:** Ing. Joel Arevalo\n- **Institución:** Universidad Nacional de Trujillo (UNT) / MPT / SENAMHI\n- **Estado Global:** 96% de cumplimiento de hipótesis científica.\n\n¿Deseas revisar la matriz de validación de objetivos o exportar el documento formal?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '👉 Ver Validación de Tesis (OE5)', actionType: 'navigate', target: 'validation' },
          { label: '📄 Descargar Tesis en Word (.docx)', actionType: 'export', target: 'docx' },
          { label: '📄 Descargar Reporte en PDF', actionType: 'export', target: 'pdf' }
        ]
      };
    }

    if (q.includes('flora') || q.includes('arbol') || q.includes('especie') || q.includes('molle') || q.includes('huarango') || q.includes('jacaranda')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `🌿 **Catálogo de Flora Urbana Adaptada a Trujillo**\n\n1. **Molle Costeño (*Schinus terebinthifolius / molle*):** Excelente follaje perenne, gran capacidad de retención de polvo ($PM_{2.5}$), muy baja demanda de agua.\n2. **Huarango / Algarrobo (*Prosopis pallida*):** Nativo del desierto costero, raíces profundas, alta fijación de nitrógeno y sombra refrescante.\n3. **Jacarandá (*Jacaranda mimosifolia*):** Dosel amplio, floración primaveral y alta atenuación acústica.\n4. **Tecoma stans (Flor amarilla):** Arbusto denso ideal para separadores viales y filtros de cañón urbano.\n\n¿Quieres simular su plantación en el Gemelo Digital?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '🌳 Probar en Simulador NbS', actionType: 'navigate', target: 'nbs_simulator' }
        ]
      };
    }

    if (q.includes('norma') || q.includes('eca') || q.includes('oefa') || q.includes('minam') || q.includes('limite') || q.includes('ley')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `⚖️ **Normativa Ambiental Peruana (ECA-Aire D.S. 003-2017-MINAM)**\n\nEl Gemelo Digital verifica continuamente el cumplimiento de:\n- **$PM_{2.5}$:** $50\\;\\mu g/m^3$ (24h) | $25\\;\\mu g/m^3$ (Anual)\n- **$PM_{10}$:** $100\\;\\mu g/m^3$ (24h)\n- **$NO_2$:** $200\\;\\mu g/m^3$ (1h)\n- **$O_3$:** $100\\;\\mu g/m^3$ (8h)\n\nZonas como el Mercado Hermelinda y Av. España superan los umbrales recomendados por OMS y demandan intervenciones NbS urgentes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '📋 Ver Propuestas de Ordenanza MPT', actionType: 'navigate', target: 'validation' },
          { label: '📥 Descargar Informe Legal OEFA (PDF)', actionType: 'export', target: 'pdf' }
        ]
      };
    }

    if (q.includes('hola') || q.includes('buenas') || q.includes('saludos') || q.includes('ayuda') || q.includes('que puedes hacer')) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `¡Saludos! 🤖 Estoy aquí para asistirte en todo lo relacionado con el **Gemelo Digital de Calidad del Aire y NbS en Trujillo**.\n\nPuedes preguntarme sobre:\n- Diagnósticos de las 6 zonas de Trujillo (Centro, Av. España, Hermelinda, Ovalo Larco, etc.).\n- Cómo funciona la calibración de sensores IoT en 2 etapas.\n- Modelos de Deep Learning (1D-CNN vs GNN) y cómo calcular cañones urbanos.\n- Diseño y simulación de techos verdes, arbolado y confort térmico (GREENPASS® / PET).\n- Generación de reportes automáticos en Excel, PDF, Word y CSV.\n\n¿Por dónde te gustaría comenzar?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '🚀 Iniciar Tour Guiado', actionType: 'trigger_guided', target: 'tour' },
          { label: t('assistant.quick.nbs'), actionType: 'trigger_guided', target: 'nbs_guide' },
          { label: '📊 Descargar Informe Completo', actionType: 'export', target: 'pdf' }
        ]
      };
    }

    // Default intelligent fallback with actionable suggestions
    return {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `Entendido. Con respecto a *"**${query}**"*, en el marco del Gemelo Digital de Trujillo podemos abordarlo desde varios frentes científicos:\n\n1. **Evaluación de microescala y cañón urbano:** Relación $H/W$ y vórtices de viento.\n2. **Inferencia predictiva:** Algoritmo 1D-CNN ($R^2=0.9925$) para $PM_{2.5}$ y temperatura.\n3. **Intervención verde NbS:** Arbolado nativo (*Molle/Huarango*) y techos verdes.\n4. **Generación documental:** Exportación de resultados a Excel o PDF.\n\nSelecciona una acción directa o indícame qué aspecto específico deseas profundizar:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: [
        { label: '🌳 Simular en Zona Activa', actionType: 'navigate', target: 'nbs_simulator' },
        { label: '🧠 Consultar Modelos de IA', actionType: 'navigate', target: 'ai_engine' },
        { label: '📡 Ver Calibración IoT', actionType: 'navigate', target: 'architecture' },
        { label: '📄 Exportar Reporte Técnico', actionType: 'export', target: 'pdf' }
      ]
    };
  };

  const handleActionClick = (action: {
    label: string;
    actionType: 'navigate' | 'export' | 'select_zone' | 'trigger_guided' | 'apply_nbs';
    target?: string;
    param?: any;
  }) => {
    if (action.actionType === 'navigate' && action.target) {
      onNavigateModule(action.target);
      // Optional: add confirmation bot message
      setMessages(prev => [
        ...prev,
        {
          id: `bot-nav-${Date.now()}`,
          sender: 'bot',
          text: `✅ Te he transportado al módulo **${action.label}**. Puedes seguir haciéndome preguntas aquí en cualquier momento.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else if (action.actionType === 'export' && action.target) {
      onExport(action.target as any, activeScenario);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-exp-${Date.now()}`,
          sender: 'bot',
          text: `📥 ¡Documento **${action.target.toUpperCase()}** generado y descargado exitosamente!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else if (action.actionType === 'select_zone' && action.param) {
      onSelectZone(action.param);
      setMessages(prev => [
        ...prev,
        {
          id: `bot-zone-${Date.now()}`,
          sender: 'bot',
          text: `📍 Zona activa cambiada a: **${action.param.name}** (${action.param.district}).\n- Temp: ${action.param.baselineTemp}°C\n- PM2.5: ${action.param.baselinePM25} µg/m³`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: [
            { label: '🌳 Simular Intervención en esta Zona', actionType: 'navigate', target: 'nbs_simulator' },
            { label: '🔍 Ver Diagnóstico Detallado', actionType: 'navigate', target: 'diagnosis' }
          ]
        }
      ]);
    } else if (action.actionType === 'trigger_guided' && action.target) {
      startGuidedFlow(action.target);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'bot',
        text: `🧹 Conversación reiniciada. ¿En qué puedo asistirte hoy con el Gemelo Digital de Trujillo?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        quickActions: [
          { label: '🚀 Tour Guiado', actionType: 'trigger_guided', target: 'tour' },
          { label: t('assistant.quick.nbs'), actionType: 'trigger_guided', target: 'nbs_guide' },
          { label: t('assistant.quick.iot'), actionType: 'trigger_guided', target: 'iot_guide' },
          { label: '🤖 Modelos de IA', actionType: 'navigate', target: 'ai_engine' }
        ]
      }
    ]);
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (Always visible at bottom right) — z-[60] garantiza estar sobre AuthScreen */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold px-3.5 py-2 rounded-2xl shadow-lg animate-bounce">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            <span>{t('assistant.floating')}</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-xl shadow-emerald-900/25 flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer relative group"
            title={t('assistant.openTitle')}
          >
            <Bot className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </button>
        </div>
      )}

      {/* CHATBOT DRAWER / MODAL WINDOW */}
      {isOpen && (
        <div
          className={`fixed z-[70] transition-all duration-300 ${
            isExpanded
              ? 'inset-4 sm:inset-8 md:inset-12'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[460px] h-[640px] max-h-[calc(100vh-2rem)]'
          } bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/90 text-white flex items-center justify-center shadow-inner border border-emerald-400/30">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">{t('assistant.headerTitle')}</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold rounded-full uppercase">
                    {t('assistant.badgeActive')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t('assistant.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              {/* Stop audio button if speaking */}
              {speakingMessageId && (
                <button
                  onClick={stopSpeaking}
                  className="px-2 py-1 bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border border-amber-400/40 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer animate-pulse"
                  title={t('assistant.stopVoice')}
                >
                  <Square className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>{t('assistant.stopVoice')}</span>
                </button>
              )}

              {/* Toggle Auto Voice Readout */}
              <button
                onClick={() => {
                  const nextState = !isVoiceOutputEnabled;
                  setIsVoiceOutputEnabled(nextState);
                  if (!nextState) stopSpeaking();
                }}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isVoiceOutputEnabled
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                    : 'hover:bg-white/10 dark:hover:bg-slate-800/50 hover:text-white text-slate-400'
                }`}
                title={isVoiceOutputEnabled ? t('assistant.voiceOn') : t('assistant.voiceOff')}
              >
                {isVoiceOutputEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-300 animate-pulse" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>

              <button
                onClick={handleClearChat}
                className="p-2 hover:bg-white dark:bg-slate-900/10 hover:text-white rounded-xl transition-all cursor-pointer"
                title={t('assistant.clearChat')}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white dark:bg-slate-900/10 hover:text-white rounded-xl transition-all cursor-pointer"
                title={isExpanded ? t('assistant.collapse') : t('assistant.expand')}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  stopSpeaking();
                  if (isListening) toggleListening();
                  setIsOpen(false);
                }}
                className="p-2 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-all cursor-pointer"
                title={t('assistant.closeChat')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Assistant Guided Category Quick Toolbar */}
          <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200/80 dark:border-slate-700 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
              <Sliders className="w-3 h-3 text-slate-400" />
              Guías:
            </span>
            <button
              onClick={() => startGuidedFlow('tour')}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer"
            >
              <Compass className="w-3 h-3 text-emerald-600" />
              Tour Tesis
            </button>
            <button
              onClick={() => startGuidedFlow('nbs_guide')}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer"
            >
              <Trees className="w-3 h-3 text-teal-600" />
              Simulador NbS
            </button>
            <button
              onClick={() => startGuidedFlow('iot_guide')}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer"
            >
              <Boxes className="w-3 h-3 text-purple-600" />
              Calibración IoT
            </button>
            <button
              onClick={() => startGuidedFlow('regulations')}
              className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-emerald-50 text-slate-700 dark:text-slate-300 hover:text-emerald-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3 h-3 text-sky-600" />
              ECA-Aire MINAM
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-800/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 text-xs shadow-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  {/* Speaker Button on Bot Messages */}
                  {msg.sender === 'bot' && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Bot className="w-3 h-3 text-emerald-600" />
                        {t('assistant.responseLabel')}
                      </span>
                      <button
                        onClick={() => speakText(msg.text, msg.id)}
                        className={`p-1 rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                          speakingMessageId === msg.id
                            ? 'bg-emerald-100 text-emerald-800 font-bold'
                            : 'hover:bg-slate-100 text-slate-400 hover:text-emerald-700'
                        }`}
                        title={speakingMessageId === msg.id ? t('assistant.stopTitle') : t('assistant.listenTitle')}
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                            <span>{t('assistant.reading')}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{t('assistant.listen')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Message formatted with basic markdown rendering */}
                  <div className="whitespace-pre-line font-normal space-y-1">
                    {msg.text.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Quick Action Interactive Buttons (if any) */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                      {msg.quickActions.map((action, actionIdx) => (
                        <button
                          key={actionIdx}
                          onClick={() => handleActionClick(action)}
                          className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 text-slate-800 dark:text-slate-100 hover:text-emerald-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-2xs group cursor-pointer"
                        >
                          <span>{action.label}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-700 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1.5 ${
                      msg.sender === 'user' ? 'text-emerald-100 text-right' : 'text-slate-400 text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-1 shadow-xs">
                    {user?.name ? user.name.charAt(0) : 'U'}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></span>
                  <span className="text-[11px] text-slate-400 ml-1">{t('assistant.typing')}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Active Voice Listening Banner (Waveform Indicator) */}
          {isListening && (
            <div className="bg-gradient-to-r from-rose-500 to-red-600 text-white px-4 py-2 flex items-center justify-between shrink-0 shadow-inner">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-white dark:bg-slate-900 animate-ping"></span>
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3.5 bg-white dark:bg-slate-900 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-5 bg-white dark:bg-slate-900 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-4 bg-white dark:bg-slate-900 rounded-full animate-bounce"></span>
                  <span className="w-1 h-6 bg-white dark:bg-slate-900 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                  <span className="w-1 h-3 bg-white dark:bg-slate-900 rounded-full animate-bounce"></span>
                </div>
                <span className="font-bold text-xs">
                  {voiceStatusText || t('assistant.listeningBanner')}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 text-rose-700 hover:bg-rose-50 rounded-xl text-[11px] font-bold shadow-xs cursor-pointer transition-all"
              >
                {t('assistant.readyStop')}
              </button>
            </div>
          )}

          {/* Quick Frequent Suggestions Pills */}
          <div className="bg-white dark:bg-slate-900 px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-[10px]">
            <span className="text-slate-400 font-bold shrink-0">{t('assistant.suggestions')}</span>
            <button
              onClick={() => {
                setInputQuery('¿Cómo funciona el modelo 1D-CNN vs GNN?');
              }}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-full whitespace-nowrap cursor-pointer transition-colors"
            >
              {t('assistant.suggestion.cnn')}
            </button>
            <button
              onClick={() => {
                setInputQuery('¿Qué especies de árboles nativos convienen en Trujillo?');
              }}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-full whitespace-nowrap cursor-pointer transition-colors"
            >
              {t('assistant.suggestion.species')}
            </button>
            <button
              onClick={() => {
                setInputQuery('¿Cómo se calcula el confort térmico GREENPASS y PET?');
              }}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-full whitespace-nowrap cursor-pointer transition-colors"
            >
              {t('assistant.suggestion.greenpass')}
            </button>
            <button
              onClick={() => {
                setInputQuery('¿Cuáles son los límites de PM2.5 según MINAM?');
              }}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-full whitespace-nowrap cursor-pointer transition-colors"
            >
              {t('assistant.suggestion.eca2')}
            </button>
          </div>

          {/* Input Form Footer (Voice & Text) */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0"
          >
            {/* Microphone Dictation Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-xs ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-md shadow-rose-900/30'
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300'
              }`}
              title={isListening ? t('assistant.micStop') : t('assistant.micStart')}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isListening ? t('assistant.inputPlaceholderListening') : t('assistant.inputPlaceholder')}
              className={`flex-1 bg-slate-50 border rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 shadow-xs transition-colors ${
                isListening
                  ? 'border-rose-400 focus:ring-rose-500/20 bg-rose-50/30'
                  : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
            />

            <button
              type="submit"
              disabled={!inputQuery.trim() || isTyping}
              className="w-10 h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white flex items-center justify-center transition-all shadow-sm shadow-emerald-900/10 shrink-0 cursor-pointer"
              title={t('assistant.sendTitle')}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
);
};

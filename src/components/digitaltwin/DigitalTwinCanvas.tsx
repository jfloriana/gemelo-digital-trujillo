import React, { useRef, useEffect, useState } from 'react';
import { SensorNode, UrbanZone, NbsIntervention } from '../../types';
import { 
  Layers, 
  Wind, 
  Flame, 
  Trees, 
  Maximize2, 
  Eye, 
  RotateCcw, 
  Sparkles,
  Info,
  Building,
  CheckCircle2
} from 'lucide-react';

interface DigitalTwinCanvasProps {
  zone: UrbanZone;
  sensors: SensorNode[];
  selectedNbs: { nbsId: string; quantityOrArea: number }[];
  nbsCatalog: NbsIntervention[];
  isSimulationActive: boolean;
  onApplyNbsQuick?: (nbsId: string) => void;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  zone,
  sensors,
  selectedNbs,
  nbsCatalog,
  isSimulationActive,
  onApplyNbsQuick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'3d_canyon' | 'thermal_grid' | 'pm_dispersion'>('3d_canyon');
  const [showAirflow, setShowAirflow] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [showThermalLayer, setShowThermalLayer] = useState<boolean>(true);
  const [showNbsElements, setShowNbsElements] = useState<boolean>(true);
  const [showBeforeAfterSplit, setShowBeforeAfterSplit] = useState<boolean>(false);
  const [splitPosition, setSplitPosition] = useState<number>(50); // percentage
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [isPlacingTree, setIsPlacingTree] = useState<boolean>(false);
  const [customTrees, setCustomTrees] = useState<{ x: number; y: number; type: string }[]>([
    { x: 180, y: 260, type: 'Molle costeño' },
    { x: 320, y: 270, type: 'Huarango' },
    { x: 480, y: 255, type: 'Tecoma stans' },
  ]);

  // Calculate current thermal & PM state based on NbS applied
  const totalTreesCount = (selectedNbs.find(n => n.nbsId === 'nbs-arbolado')?.quantityOrArea || 0) + customTrees.length;
  const greenRoofsArea = selectedNbs.find(n => n.nbsId === 'nbs-techo-verde')?.quantityOrArea || 0;
  const greenWallsArea = selectedNbs.find(n => n.nbsId === 'nbs-muro-verde')?.quantityOrArea || 0;
  const permeableArea = selectedNbs.find(n => n.nbsId === 'nbs-pavimento-permeable')?.quantityOrArea || 0;

  const currentTempMitigation = isSimulationActive ? Math.min(4.8, (totalTreesCount * 0.08) + (greenRoofsArea * 0.002) + (greenWallsArea * 0.003) + (permeableArea * 0.001)) : 0;
  const currentPmMitigationPercent = isSimulationActive ? Math.min(36, (totalTreesCount * 0.6) + (greenRoofsArea * 0.015) + (greenWallsArea * 0.02)) : 0;

  const effectiveTemp = Number((zone.baselineTemp - currentTempMitigation).toFixed(1));
  const effectivePM25 = Number((zone.baselinePM25 * (1 - currentPmMitigationPercent / 100)).toFixed(1));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let tick = 0;

    const render = () => {
      tick += 1;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background Sky / Atmosphere Gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      if (effectivePM25 > 55) {
        skyGradient.addColorStop(0, '#fef3c7'); // Hazy polluted sky
        skyGradient.addColorStop(0.6, '#fed7aa');
        skyGradient.addColorStop(1, '#f1f5f9');
      } else {
        skyGradient.addColorStop(0, '#e0f2fe'); // Clearer sky
        skyGradient.addColorStop(0.6, '#f0fdf4');
        skyGradient.addColorStop(1, '#f8fafc');
      }
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      // Horizon & Ground
      const groundY = height * 0.58;

      // Draw Ground / Asphalt Road
      ctx.fillStyle = isSimulationActive && permeableArea > 200 ? '#475569' : '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(width, groundY);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Road markings (Av. España / Trujillo Street)
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.setLineDash([16, 14]);
      ctx.beginPath();
      ctx.moveTo(0, groundY + 70);
      ctx.lineTo(width, groundY + 70);
      ctx.stroke();
      ctx.setLineDash([]);

      // Sidewalks
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, groundY - 15, width, 25); // Back sidewalk
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, height - 40, width, 40); // Front sidewalk

      // 3D Buildings Configuration (Microscale street canyon)
      const buildings = [
        { id: 1, x: 20, y: groundY - 160, w: 120, h: 160, depth: 35, color: '#f8fafc', roofColor: '#cbd5e1', hasGreenRoof: greenRoofsArea > 50 || isSimulationActive, hasGreenWall: greenWallsArea > 30, name: 'Casona Colonial / Comercio' },
        { id: 2, x: 160, y: groundY - 220, w: 150, h: 220, depth: 45, color: '#e2e8f0', roofColor: '#94a3b8', hasGreenRoof: greenRoofsArea > 150 || isSimulationActive, hasGreenWall: greenWallsArea > 60, name: 'Edificio Residencial-Comercial (7 Pisos)' },
        { id: 3, x: 330, y: groundY - 130, w: 110, h: 130, depth: 30, color: '#f1f5f9', roofColor: '#cbd5e1', hasGreenRoof: false, hasGreenWall: greenWallsArea > 100, name: 'Galería Comercial Mayorista' },
        { id: 4, x: 460, y: groundY - 250, w: 170, h: 250, depth: 50, color: '#e2e8f0', roofColor: '#94a3b8', hasGreenRoof: greenRoofsArea > 100 || isSimulationActive, hasGreenWall: greenWallsArea > 150, name: 'Sede Institucional / Oficina' },
        { id: 5, x: 650, y: groundY - 180, w: 130, h: 180, depth: 40, color: '#f8fafc', roofColor: '#cbd5e1', hasGreenRoof: greenRoofsArea > 200 || isSimulationActive, hasGreenWall: false, name: 'Centro de Salud / Hospital' }
      ];

      // Draw Buildings Isometric 2.5D
      buildings.forEach(b => {
        const isHovered = selectedBuilding === b.id;

        // Facade
        ctx.fillStyle = isHovered ? '#dbeafe' : (b.hasGreenWall && showNbsElements ? '#15803d' : b.color);
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(b.x, b.y, b.w, b.h);

        // Windows matrix
        const rows = Math.floor(b.h / 30);
        const cols = Math.floor(b.w / 28);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const wx = b.x + 8 + c * 24;
            const wy = b.y + 12 + r * 28;
            ctx.fillStyle = isSimulationActive ? '#60a5fa' : '#334155';
            ctx.fillRect(wx, wy, 14, 18);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(wx, wy, 14, 18);
          }
        }

        // Green Wall texture on facade if enabled
        if (b.hasGreenWall && showNbsElements) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
          ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
          // Foliage pattern
          ctx.fillStyle = '#166534';
          for (let i = 0; i < 20; i++) {
            const fx = b.x + 10 + (i * 17) % (b.w - 20);
            const fy = b.y + 15 + (i * 23) % (b.h - 30);
            ctx.beginPath();
            ctx.arc(fx, fy, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 3D Roof (Parallelogram)
        ctx.fillStyle = b.hasGreenRoof && showNbsElements ? '#16a34a' : b.roofColor;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + b.depth, b.y - b.depth * 0.5);
        ctx.lineTo(b.x + b.w + b.depth, b.y - b.depth * 0.5);
        ctx.lineTo(b.x + b.w, b.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();

        // Green Roof Plants details
        if (b.hasGreenRoof && showNbsElements) {
          ctx.fillStyle = '#22c55e';
          for (let k = 0; k < 12; k++) {
            const rx = b.x + 8 + (k * 15) % (b.w - 10);
            const ry = b.y - 4 - ((k * 5) % 15);
            ctx.beginPath();
            ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 3D Side Wall
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(b.x + b.w, b.y);
        ctx.lineTo(b.x + b.w + b.depth, b.y - b.depth * 0.5);
        ctx.lineTo(b.x + b.w + b.depth, b.y + b.h - b.depth * 0.5);
        ctx.lineTo(b.x + b.w, b.y + b.h);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();
      });

      // Airflow Vectors (LBM - Lattice Boltzmann Method simulation)
      if (showAirflow) {
        ctx.strokeStyle = isSimulationActive ? 'rgba(56, 189, 248, 0.65)' : 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1.8;
        const arrowCount = 14;
        for (let i = 0; i < arrowCount; i++) {
          const baseY = groundY - 140 + (i % 5) * 35;
          const speedFactor = 1.2 + (i % 3) * 0.6;
          const waveX = ((tick * speedFactor * 1.5) + i * 65) % (width + 100) - 50;
          
          // Vortices inside street canyon
          const vortexOffset = Math.sin((waveX / 80) + (i * 0.5)) * 14;
          
          ctx.beginPath();
          ctx.moveTo(waveX, baseY + vortexOffset);
          ctx.lineTo(waveX + 32, baseY + vortexOffset + Math.cos(tick * 0.05 + i) * 4);
          ctx.stroke();

          // Arrowhead
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.moveTo(waveX + 32, baseY + vortexOffset);
          ctx.lineTo(waveX + 24, baseY + vortexOffset - 4);
          ctx.lineTo(waveX + 24, baseY + vortexOffset + 4);
          ctx.fill();
        }
      }

      // Thermal Field Overlay (UHI Heat gradient)
      if (showThermalLayer) {
        const heatGrad = ctx.createRadialGradient(
          width * 0.5, groundY + 20, 30,
          width * 0.5, groundY + 20, width * 0.6
        );
        if (effectiveTemp > 30) {
          heatGrad.addColorStop(0, 'rgba(239, 68, 68, 0.38)'); // Intense Heat Island
          heatGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.22)');
          heatGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else if (effectiveTemp > 27) {
          heatGrad.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
          heatGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.12)');
          heatGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          heatGrad.addColorStop(0, 'rgba(34, 197, 94, 0.25)'); // Cool NbS comfort zone
          heatGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.08)');
          heatGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        ctx.fillStyle = heatGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // PM2.5 / PM10 Particle Plumes from Traffic
      if (showParticles) {
        const particleCount = isSimulationActive ? Math.max(12, Math.round(effectivePM25 * 0.6)) : Math.round(zone.baselinePM25 * 1.4);
        for (let p = 0; p < particleCount; p++) {
          const px = ((p * 43) + (tick * 1.2)) % width;
          const py = groundY + 20 + Math.sin(p + tick * 0.04) * 45 - (p % 4) * 15;
          const radius = (p % 3 === 0) ? 3.5 : 2.0;

          ctx.fillStyle = isSimulationActive 
            ? 'rgba(100, 116, 139, 0.45)' 
            : (effectivePM25 > 50 ? 'rgba(220, 38, 38, 0.75)' : 'rgba(217, 119, 6, 0.6)');
          
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Urban Trees (Corredor Arbolado)
      if (showNbsElements) {
        const allTrees = [
          ...customTrees,
          ...(selectedNbs.find(n => n.nbsId === 'nbs-arbolado')?.quantityOrArea ? [
            { x: 100, y: groundY + 25, type: 'Molle Costeño' },
            { x: 240, y: groundY + 30, type: 'Huarango' },
            { x: 410, y: groundY + 20, type: 'Jacarandá' },
            { x: 570, y: groundY + 28, type: 'Tecoma Stans' },
            { x: 720, y: groundY + 22, type: 'Molle Costeño' }
          ] : [])
        ];

        allTrees.forEach((t) => {
          // Tree Trunk
          ctx.fillStyle = '#78350f';
          ctx.fillRect(t.x - 4, t.y - 30, 8, 32);

          // Tree Shadow on road
          ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
          ctx.beginPath();
          ctx.ellipse(t.x, t.y + 2, 26, 9, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tree Canopy
          const canopyGrad = ctx.createRadialGradient(t.x, t.y - 45, 6, t.x, t.y - 45, 28);
          canopyGrad.addColorStop(0, '#4ade80');
          canopyGrad.addColorStop(0.7, '#15803d');
          canopyGrad.addColorStop(1, '#14532d');
          ctx.fillStyle = canopyGrad;

          ctx.beginPath();
          ctx.arc(t.x, t.y - 45, 26, 0, Math.PI * 2);
          ctx.arc(t.x - 12, t.y - 38, 18, 0, Math.PI * 2);
          ctx.arc(t.x + 14, t.y - 40, 19, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // IoT Sensors overlay pins
      sensors.filter(s => s.zoneId === zone.id).forEach((s, idx) => {
        const sx = 140 + idx * 220;
        const sy = groundY - 40;

        // Pin base
        ctx.fillStyle = '#0f766e';
        ctx.beginPath();
        ctx.arc(sx, sy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pulsing ring
        const pulse = (Math.sin(tick * 0.08 + idx) + 1) * 6;
        ctx.strokeStyle = 'rgba(15, 118, 110, 0.5)';
        ctx.beginPath();
        ctx.arc(sx, sy, 10 + pulse, 0, Math.PI * 2);
        ctx.stroke();

        // Label box
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(sx - 35, sy - 34, 70, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px monospace';
        ctx.fillText(s.code, sx - 28, sy - 21);
      });

      // Split Screen Effect (Before vs After Comparison)
      if (showBeforeAfterSplit) {
        const splitX = (width * splitPosition) / 100;

        // Divider bar
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, height);
        ctx.stroke();

        // Split badge
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(splitX - 45, 12, 90, 24);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(splitX - 45, 12, 90, 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('ANTES | DESPUÉS', splitX - 40, 28);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    zone,
    sensors,
    viewMode,
    showAirflow,
    showParticles,
    showThermalLayer,
    showNbsElements,
    showBeforeAfterSplit,
    splitPosition,
    selectedBuilding,
    customTrees,
    isSimulationActive,
    totalTreesCount,
    greenRoofsArea,
    greenWallsArea,
    permeableArea,
    effectiveTemp,
    effectivePM25
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (isPlacingTree) {
      setCustomTrees(prev => [...prev, { x, y, type: 'Molle costeño' }]);
      if (onApplyNbsQuick) onApplyNbsQuick('nbs-arbolado');
      setIsPlacingTree(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      {/* Top Controller Bar */}
      <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <h3 className="text-slate-900 text-sm font-semibold flex items-center gap-2">
              Gemelo Digital 3D a Microescala: {zone.name.split(':')[1]?.trim() || zone.name}
            </h3>
            <p className="text-xs text-slate-500">
              Malla discretizada 5x5m | Simulación CFD / LBM + Dispersión Gaussiana & NbS
            </p>
          </div>
        </div>

        {/* View mode toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAirflow(!showAirflow)}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              showAirflow ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            title="Vórtices de viento y flujo LBM en cañón urbano"
          >
            <Wind className="w-3.5 h-3.5" />
            Flujo LBM
          </button>

          <button
            onClick={() => setShowThermalLayer(!showThermalLayer)}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              showThermalLayer ? 'bg-amber-50 text-amber-700 border border-amber-300 shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            title="Gradiente térmico de Isla de Calor Urbano (UHI)"
          >
            <Flame className="w-3.5 h-3.5" />
            Gradiente Térmico
          </button>

          <button
            onClick={() => setShowParticles(!showParticles)}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              showParticles ? 'bg-red-50 text-red-700 border border-red-300 shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            title="Partículas suspendidas PM2.5 / PM10"
          >
            <Layers className="w-3.5 h-3.5" />
            Pluma PM2.5
          </button>

          <button
            onClick={() => setShowBeforeAfterSplit(!showBeforeAfterSplit)}
            className={`px-3 py-1.5 text-xs rounded-xl font-medium flex items-center gap-1.5 transition-all ${
              showBeforeAfterSplit ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Split Antes/Después
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full aspect-[16/9] min-h-[380px] bg-slate-100 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={880}
          height={480}
          onClick={handleCanvasClick}
          className={`w-full h-full object-contain cursor-${isPlacingTree ? 'crosshair' : 'default'}`}
        />

        {/* Live Simulation Overlay HUD */}
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-lg max-w-xs text-xs space-y-2 text-slate-800">
          <div className="flex items-center justify-between text-slate-700 font-semibold pb-1 border-b border-slate-100">
            <span>Telemetría en Vivo (Microescala)</span>
            <span className="text-emerald-600 font-mono text-[11px]">Sincronizado</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px] font-medium">Temp. Microescala</span>
              <span className={`text-base font-bold font-mono ${effectiveTemp > 30 ? 'text-red-600' : 'text-emerald-600'}`}>
                {effectiveTemp} °C
              </span>
              {currentTempMitigation > 0 && (
                <span className="text-[10px] text-emerald-700 block font-medium">
                  ↓ -{currentTempMitigation.toFixed(1)} °C por NbS
                </span>
              )}
            </div>

            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[10px] font-medium">PM2.5 Calibrado</span>
              <span className={`text-base font-bold font-mono ${effectivePM25 > 55 ? 'text-red-600' : effectivePM25 > 35 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {effectivePM25} µg/m³
              </span>
              {currentPmMitigationPercent > 0 && (
                <span className="text-[10px] text-emerald-700 block font-medium">
                  ↓ -{currentPmMitigationPercent.toFixed(1)}% mitigado
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <span className="font-medium">Delta Isla de Calor (UHI):</span>
            <span className="font-semibold text-amber-700 font-mono">
              +{(Math.max(0.8, (effectiveTemp - 24.5) * 0.6)).toFixed(1)} °C
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
            <span className="font-medium">Confort Térmico (PET):</span>
            <span className="font-semibold text-teal-700 font-mono">
              {(effectiveTemp + 2.8).toFixed(1)} °C
            </span>
          </div>
        </div>

        {/* Quick Interaction Panel (Plant tree or roof on canvas) */}
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-lg flex items-center gap-2">
          <button
            onClick={() => setIsPlacingTree(!isPlacingTree)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isPlacingTree 
                ? 'bg-emerald-600 text-white animate-pulse' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Trees className="w-4 h-4" />
            {isPlacingTree ? 'Haz clic en el mapa para plantar' : 'Plantar Árbol en Cañón'}
          </button>

          <button
            onClick={() => setCustomTrees([])}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors"
            title="Reiniciar árboles colocados"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Flora nativa recomendada: <strong className="text-slate-700">Molle Costeño & Huarango</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            Viento predominante: <strong className="text-slate-700">Suroeste (SO 2.1 m/s)</strong>
          </span>
        </div>
        <div className="text-slate-500">
          Referencia: <strong className="text-slate-700">Li et al. (2026) & Zhivkov et al. (2025)</strong>
        </div>
      </div>
    </div>
  );
};

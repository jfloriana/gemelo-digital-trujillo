import React, { useState, useEffect } from 'react';
import { SensorNode, UrbanZone, IoTTelemetryPayload, IngestionLog, QaQcValidation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { 
  Radio, 
  Cpu, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Database, 
  FileCode, 
  FileText, 
  Wifi, 
  BatteryMedium, 
  Layers, 
  Check, 
  AlertCircle,
  Copy,
  Clock,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface IoTIntegrationModuleProps {
  sensors: SensorNode[];
  zones: UrbanZone[];
  onSensorUpdate: (updatedSensors: SensorNode[]) => void;
  onExportReports: (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => void;
}

export const IoTIntegrationModule: React.FC<IoTIntegrationModuleProps> = ({
  sensors,
  zones,
  onSensorUpdate,
  onExportReports
}) => {
  const { user, permissions } = useAuth();
  const { t } = useI18n();

  // Selected sensor for inspection/injection
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || 'sensor-trj-01');
  const activeSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];

  // Protocol Simulation Settings
  const [activeProtocol, setActiveProtocol] = useState<'MQTT' | 'REST_API' | 'WEBSOCKET'>('MQTT');
  const [mqttBroker, setMqttBroker] = useState<string>('mqtts://iot.trujillo-gemelodigital.pe:8883');
  const [mqttTopic, setMqttTopic] = useState<string>(`trujillo/sensors/${activeSensor.code}/telemetry`);
  const [mqttQoS, setMqttQoS] = useState<number>(1);
  const [apiEndpoint, setApiEndpoint] = useState<string>('https://api.trujillo-gemelodigital.pe/v1/iot/telemetry');
  const [apiKey, setApiKey] = useState<string>('trj_live_sec_99a8b7c6d5e4f3a2b1');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Packet Injector state
  const [injectPM25, setInjectPM25] = useState<number>(activeSensor.lastReading.pm25);
  const [injectPM10, setInjectPM10] = useState<number>(activeSensor.lastReading.pm10);
  const [injectO3, setInjectO3] = useState<number>(activeSensor.lastReading.o3);
  const [injectNO2, setInjectNO2] = useState<number>(activeSensor.lastReading.no2);
  const [injectTemp, setInjectTemp] = useState<number>(activeSensor.lastReading.temperature);
  const [injectHumidity, setInjectHumidity] = useState<number>(activeSensor.lastReading.humidity);
  const [injectBattery, setInjectBattery] = useState<number>(94);
  const [injectRssi, setInjectRssi] = useState<number>(-68);
  const [isAutoStreaming, setIsAutoStreaming] = useState<boolean>(true);
  const [lastInjectSuccess, setLastInjectSuccess] = useState<boolean>(false);

  // Ingestion Stream Logs
  const [logs, setLogs] = useState<IngestionLog[]>([
    {
      id: 'log-01',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
      protocol: 'MQTT',
      topicOrEndpoint: `trujillo/sensors/TRJ-IOT-01/telemetry`,
      sensorCode: 'TRJ-IOT-01',
      status: 'ACCEPTED_CALIBRATED',
      rawPM25: 58.4,
      calibratedPM25: 46.8,
      rawTemp: 29.5,
      calibratedTemp: 28.9,
      rawO3: 21.0,
      calibratedO3: 21.0,
      qaFlags: ['RANGE_OK', 'HYGRO_GROWTH_CORRECTED (a=0.25)', 'DRIFT_COMPENSATED'],
      latencyMs: 14
    },
    {
      id: 'log-02',
      timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
      protocol: 'MQTT',
      topicOrEndpoint: `trujillo/sensors/TRJ-IOT-03/telemetry`,
      sensorCode: 'TRJ-IOT-03',
      status: 'ACCEPTED_CALIBRATED',
      rawPM25: 84.2,
      calibratedPM25: 67.4,
      rawTemp: 32.8,
      calibratedTemp: 32.1,
      rawO3: 16.8,
      calibratedO3: 16.8,
      qaFlags: ['RANGE_OK', 'PEAK_FLOW_FLAG', '2_STAGE_CALIB_OK'],
      latencyMs: 18
    }
  ]);

  // Update MQTT Topic when selected sensor changes
  useEffect(() => {
    if (activeSensor) {
      setMqttTopic(`trujillo/sensors/${activeSensor.code}/telemetry`);
      setInjectPM25(activeSensor.lastReading.pm25);
      setInjectPM10(activeSensor.lastReading.pm10);
      setInjectO3(activeSensor.lastReading.o3);
      setInjectNO2(activeSensor.lastReading.no2);
      setInjectTemp(activeSensor.lastReading.temperature);
      setInjectHumidity(activeSensor.lastReading.humidity);
    }
  }, [activeSensor.code]);

  // 2-Stage Calibration Function (Zhivkov et al., 2025 & Cowell et al., 2025)
  const calculateCalibration = (
    rawPM25: number, 
    rawTemp: number, 
    humidity: number,
    rawO3: number
  ): QaQcValidation => {
    const flags: string[] = [];
    let isValid = true;

    // QA/QC Range checks
    if (rawPM25 < 0 || rawPM25 > 500) {
      flags.push('OUT_OF_BOUNDS_PM25');
      isValid = false;
    }
    if (rawTemp < 5 || rawTemp > 55) {
      flags.push('OUT_OF_BOUNDS_TEMP');
      isValid = false;
    }
    if (humidity < 0 || humidity > 100) {
      flags.push('OUT_OF_BOUNDS_RH');
      isValid = false;
    }

    // Stage 1: Non-linear Hygroscopic Growth Correction
    // PM_hygro = PM_raw / (1 + a * (RH^2 / (1 - RH)))
    const rhDec = Math.min(0.95, humidity / 100);
    const a = 0.25;
    const hygroFactor = 1 + a * (Math.pow(rhDec, 2) / (1 - rhDec));
    let pmHygro = rawPM25 / Math.max(1, hygroFactor);
    flags.push(`HYGRO_CORRECTED (Factor ${hygroFactor.toFixed(2)})`);

    // Stage 2: Temperature and Drift Compensation
    const tempRef = 24.0;
    const beta = 0.18;
    const tempDelta = rawTemp - tempRef;
    const calibratedPM25 = Math.max(2.0, Number((pmHygro - beta * tempDelta).toFixed(1)));
    const calibratedTemp = Number((rawTemp - 0.6).toFixed(1)); // Sensor self-heating compensation
    const calibratedO3 = Number((rawO3 * 0.98).toFixed(1));

    flags.push('SELF_HEATING_COMPENSATED (-0.6°C)');
    flags.push('CALIBRATION_2_STAGE_VALIDATED');

    return {
      isValid,
      flags,
      appliedCorrections: {
        hygroscopicFactor: Number(hygroFactor.toFixed(3)),
        thermalDriftDelta: Number(tempDelta.toFixed(2)),
        calibrated_pm25: calibratedPM25,
        calibrated_temp: calibratedTemp,
        calibrated_o3: calibratedO3
      }
    };
  };

  // Process and Inject Telemetry Packet
  const handleSendTelemetryPacket = (
    pm25Val = injectPM25,
    pm10Val = injectPM10,
    o3Val = injectO3,
    no2Val = injectNO2,
    tempVal = injectTemp,
    humVal = injectHumidity
  ) => {
    const calibResult = calculateCalibration(pm25Val, tempVal, humVal, o3Val);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullTimeStr = new Date().toLocaleTimeString();

    // Create new environmental reading
    const newReading = {
      ...activeSensor.lastReading,
      timestamp: nowStr,
      pm25: calibResult.appliedCorrections.calibrated_pm25,
      pm10: Number((calibResult.appliedCorrections.calibrated_pm25 * 1.76).toFixed(1)),
      o3: calibResult.appliedCorrections.calibrated_o3,
      no2: no2Val,
      temperature: calibResult.appliedCorrections.calibrated_temp,
      humidity: humVal,
      heatIndex: Number((calibResult.appliedCorrections.calibrated_temp + (humVal / 100) * 2.6).toFixed(1)),
      uhiDelta: Number((Math.max(1.0, (calibResult.appliedCorrections.calibrated_temp - 23.5) * 0.65)).toFixed(1)),
      petScore: Number((calibResult.appliedCorrections.calibrated_temp + 3.2).toFixed(1)),
      tcsScore: Math.max(10, Math.min(100, Math.round(100 - (calibResult.appliedCorrections.calibrated_temp - 20) * 4.5 - (calibResult.appliedCorrections.calibrated_pm25 / 1.5)))),
      aqiIndex: Math.round(calibResult.appliedCorrections.calibrated_pm25 * 2.8),
      aqiCategory: (calibResult.appliedCorrections.calibrated_pm25 <= 12 ? 'Buena' :
                    calibResult.appliedCorrections.calibrated_pm25 <= 35.4 ? 'Moderada' :
                    calibResult.appliedCorrections.calibrated_pm25 <= 55.4 ? 'Dañina para grupos sensibles' :
                    calibResult.appliedCorrections.calibrated_pm25 <= 150.4 ? 'Dañina' : 'Muy dañina') as any
    };

    // Update sensor state
    const updatedSensors = sensors.map(s => {
      if (s.id === activeSensor.id) {
        const newHistory = [...s.hourlyHistory.slice(1), newReading];
        return {
          ...s,
          rssi: injectRssi,
          batteryPct: injectBattery,
          lastReading: newReading,
          hourlyHistory: newHistory
        };
      }
      return s;
    });

    onSensorUpdate(updatedSensors);

    // Append new log entry
    const newLog: IngestionLog = {
      id: `log-${Date.now()}`,
      timestamp: fullTimeStr,
      protocol: activeProtocol,
      topicOrEndpoint: activeProtocol === 'MQTT' ? mqttTopic : apiEndpoint,
      sensorCode: activeSensor.code,
      status: calibResult.isValid ? 'ACCEPTED_CALIBRATED' : 'REJECTED_QAQC',
      rawPM25: pm25Val,
      calibratedPM25: calibResult.appliedCorrections.calibrated_pm25,
      rawTemp: tempVal,
      calibratedTemp: calibResult.appliedCorrections.calibrated_temp,
      rawO3: o3Val,
      calibratedO3: calibResult.appliedCorrections.calibrated_o3,
      qaFlags: calibResult.flags,
      latencyMs: Math.floor(10 + Math.random() * 15)
    };

    setLogs(prev => [newLog, ...prev.slice(0, 19)]);
    setLastInjectSuccess(true);
    setTimeout(() => setLastInjectSuccess(false), 1800);
  };

  // Periodic Auto-Streaming simulation (1 packet every 12 seconds)
  useEffect(() => {
    if (!isAutoStreaming) return;
    const interval = setInterval(() => {
      const randomSensor = sensors[Math.floor(Math.random() * sensors.length)];
      const basePM = randomSensor.lastReading.pm25;
      const baseTemp = randomSensor.lastReading.temperature;
      
      const jitterPM = Number((basePM + (Math.random() * 6 - 3)).toFixed(1));
      const jitterTemp = Number((baseTemp + (Math.random() * 0.8 - 0.4)).toFixed(1));
      const jitterO3 = Number((randomSensor.lastReading.o3 + (Math.random() * 2 - 1)).toFixed(1));
      const jitterHum = Math.round(randomSensor.lastReading.humidity + (Math.random() * 4 - 2));

      // Calculate for this random sensor
      const calib = calculateCalibration(jitterPM, jitterTemp, jitterHum, jitterO3);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newReading = {
        ...randomSensor.lastReading,
        timestamp: nowStr,
        pm25: calib.appliedCorrections.calibrated_pm25,
        temperature: calib.appliedCorrections.calibrated_temp,
        o3: calib.appliedCorrections.calibrated_o3,
        humidity: jitterHum
      };

      const updated = sensors.map(s => s.id === randomSensor.id ? { ...s, lastReading: newReading } : s);
      onSensorUpdate(updated);

      const logItem: IngestionLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        protocol: 'MQTT',
        topicOrEndpoint: `trujillo/sensors/${randomSensor.code}/telemetry`,
        sensorCode: randomSensor.code,
        status: 'ACCEPTED_CALIBRATED',
        rawPM25: jitterPM,
        calibratedPM25: calib.appliedCorrections.calibrated_pm25,
        rawTemp: jitterTemp,
        calibratedTemp: calib.appliedCorrections.calibrated_temp,
        rawO3: jitterO3,
        calibratedO3: calib.appliedCorrections.calibrated_o3,
        qaFlags: calib.flags,
        latencyMs: Math.floor(8 + Math.random() * 16)
      };

      setLogs(prev => [logItem, ...prev.slice(0, 19)]);
    }, 12000);

    return () => clearInterval(interval);
  }, [isAutoStreaming, sensors]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 1500);
  };

  // Sample JSON payload for docs / copy
  const sampleJsonPayload = JSON.stringify({
    sensor_code: activeSensor.code,
    zone_id: activeSensor.zoneId,
    timestamp: new Date().toISOString(),
    telemetry: {
      raw_pm25: injectPM25,
      raw_pm10: injectPM10,
      raw_o3: injectO3,
      raw_no2: injectNO2,
      raw_temp: injectTemp,
      raw_humidity: injectHumidity,
      battery_level: injectBattery,
      rssi_dbm: injectRssi
    },
    auth_token: apiKey
  }, null, 2);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200/60 text-xs font-semibold rounded-lg uppercase tracking-wider">
                {t('iot.badge')}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-semibold rounded-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('iot.activeBadge')}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {t('iot.title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl mt-1">
              {t('iot.desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportReports('csv')}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title={t('iot.btnCsvTitle')}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-600" />
              {t('iot.btnCsv')}
            </button>
            <button
              onClick={() => onExportReports('docx')}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-sky-900/10 cursor-pointer"
              title={t('iot.btnDocxTitle')}
            >
              <FileText className="w-3.5 h-3.5" />
              {t('iot.btnDocx')}
            </button>
          </div>
        </div>
      </div>

      {/* Protocol Architecture & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Protocol Settings Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-600" />
              {t('iot.protocolTitle')}
            </h3>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
              <button
                onClick={() => setActiveProtocol('MQTT')}
                className={`px-2 py-1 rounded-md transition-all ${
                  activeProtocol === 'MQTT' ? 'bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                MQTT v5.0
              </button>
              <button
                onClick={() => setActiveProtocol('REST_API')}
                className={`px-2 py-1 rounded-md transition-all ${
                  activeProtocol === 'REST_API' ? 'bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                REST API
              </button>
            </div>
          </div>

          {activeProtocol === 'MQTT' ? (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium block">{t('iot.brokerLabel')}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={mqttBroker}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(mqttBroker, 'broker')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    title={t('iot.copyBroker')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium block">{t('iot.topicLabel')}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={mqttTopic}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-800 font-mono font-semibold"
                  />
                  <button
                    onClick={() => copyToClipboard(mqttTopic, 'topic')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    title={t('iot.copyTopic')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t('iot.qosLabel')}</span>
                  <strong className="text-xs text-slate-800 dark:text-slate-100 font-semibold font-mono">{t('iot.qosVal')}</strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t('iot.authLabel')}</span>
                  <strong className="text-xs text-emerald-700 font-semibold font-mono">{t('iot.authVal')}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium block">{t('iot.endpointLabel')}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={apiEndpoint}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400 font-medium block">{t('iot.bearerLabel')}</label>
                <input
                  type="password"
                  readOnly
                  value={apiKey}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
                <span>{t('iot.headerRequired')} <code>Authorization: Bearer {apiKey.slice(0, 12)}...</code></span>
              </div>
            </div>
          )}

          {copiedText && (
            <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{t('iot.copied')}</span>
            </div>
          )}

          {/* Auto-Streaming Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t('iot.streamingLabel')}</span>
            <button
              onClick={() => setIsAutoStreaming(!isAutoStreaming)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                isAutoStreaming ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isAutoStreaming ? t('iot.streamingActive') : t('iot.streamingPaused')}
            </button>
          </div>
        </div>

        {/* 2-Stage Calibration Math & QA/QC Engine Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {t('iot.pipelineTitle')}
            </h3>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              {t('iot.pipelineBadge')}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Step 1 */}
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-100 font-semibold">
                <span>{t('iot.step1Title')}</span>
                <span className="text-[10px] text-sky-700 font-mono">{t('iot.stage1')}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                {t('iot.step1Formula')}
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                {t('iot.step1Desc')}
              </span>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-slate-100 font-semibold">
                <span>{t('iot.step2Title')}</span>
                <span className="text-[10px] text-emerald-700 font-mono">{t('iot.stage2')}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                {t('iot.step2Formula')}
              </p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                {t('iot.step2Desc')}
              </span>
            </div>

            {/* Validation Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block font-medium">{t('iot.r2Raw')}</span>
                <strong className="text-sm font-bold text-rose-700 font-mono">{t('iot.r2RawVal')}</strong>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 block font-medium">{t('iot.r2Cal')}</span>
                <strong className="text-sm font-bold text-emerald-800 font-mono">{t('iot.r2CalVal')}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Live Packet Injector Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              {t('iot.injectorTitle')}
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('iot.injectorSub')}</span>
          </div>

          <div className="space-y-3">
            {/* Target sensor dropdown */}
            <div className="space-y-1">
              <label className="text-xs text-slate-700 dark:text-slate-300 font-semibold block">{t('iot.targetNode')}</label>
              <select
                value={selectedSensorId}
                onChange={(e) => setSelectedSensorId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                {sensors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name} ({s.zoneName})
                  </option>
                ))}
              </select>
            </div>

            {/* Slider PM2.5 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{t('iot.pmRaw')}</span>
                <strong className="font-mono text-slate-900 dark:text-white">{injectPM25} µg/m³</strong>
              </div>
              <input
                type="range"
                min="5"
                max="180"
                step="1"
                value={injectPM25}
                onChange={(e) => setInjectPM25(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider Temperatura */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{t('iot.tempRaw')}</span>
                <strong className="font-mono text-slate-900 dark:text-white">{injectTemp} °C</strong>
              </div>
              <input
                type="range"
                min="18"
                max="42"
                step="0.1"
                value={injectTemp}
                onChange={(e) => setInjectTemp(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider Humedad Relativa */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{t('iot.humLabel')}</span>
                <strong className="font-mono text-slate-900 dark:text-white">{injectHumidity} %</strong>
              </div>
              <input
                type="range"
                min="35"
                max="95"
                step="1"
                value={injectHumidity}
                onChange={(e) => setInjectHumidity(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slider Ozono O3 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">{t('iot.o3Label')}</span>
                <strong className="font-mono text-slate-900 dark:text-white">{injectO3} ppb</strong>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="1"
                value={injectO3}
                onChange={(e) => setInjectO3(Number(e.target.value))}
                className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={() => handleSendTelemetryPacket()}
              disabled={!permissions.canInjectIoT}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {!permissions.canInjectIoT ? t('iot.btnNoPerm') : (lastInjectSuccess ? t('iot.btnPublished') : t('iot.btnPublish'))}
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Sensor Live Status Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-600" />
              {t('iot.fleetTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('iot.fleetDesc')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
              {t('iot.onlineBadge')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-mono border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">{t('iot.col.sensor')}</th>
                <th className="py-2.5 px-3">{t('iot.col.zone')}</th>
                <th className="py-2.5 px-3">{t('iot.col.hardware')}</th>
                <th className="py-2.5 px-3">{t('iot.col.temp')}</th>
                <th className="py-2.5 px-3">{t('iot.col.pm')}</th>
                <th className="py-2.5 px-3">{t('iot.col.o3no2')}</th>
                <th className="py-2.5 px-3">{t('iot.col.signal')}</th>
                <th className="py-2.5 px-3">{t('iot.col.calib')}</th>
                <th className="py-2.5 px-3">{t('iot.col.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sensors.map(s => {
                const isSelected = s.id === selectedSensorId;
                return (
                  <tr 
                    key={s.id} 
                    className={`transition-colors ${isSelected ? 'bg-sky-50/70 font-medium' : 'hover:bg-slate-50/80'}`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <div>
                          <strong className="text-slate-900 dark:text-white font-mono">{s.code}</strong>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{s.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">{s.zoneName}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">{s.sensorType}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white font-semibold">{s.lastReading.temperature} °C</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{s.lastReading.pm25} µg/m³</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {s.lastReading.o3} / {s.lastReading.no2} ppb
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Wifi className="w-3 h-3 text-sky-600" />
                        <span>{s.rssi || -68} dBm</span>
                        <span className="text-slate-300">|</span>
                        <BatteryMedium className="w-3 h-3 text-emerald-600" />
                        <span>{s.batteryPct || 94}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold font-mono">
                        R² = {s.r2ScoreCalibrated}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setSelectedSensorId(s.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          isSelected 
                            ? 'bg-sky-600 text-white shadow-2xs' 
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {isSelected ? t('iot.btnSelected') : t('iot.btnInspect')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Ingestion Stream Activity Log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('iot.logTitle')}
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {t('iot.logCount').replace('{count}', String(logs.length))}
          </span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-xs pr-1">
          {logs.map(log => (
            <div 
              key={log.id} 
              className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-semibold">{log.timestamp}</span>
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                  {log.protocol}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{log.sensorCode}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">{log.topicOrEndpoint}</span>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <div>
                  <span className="text-slate-400">PM2.5: </span>
                  <span className="text-slate-500 dark:text-slate-400 line-through mr-1">{log.rawPM25}</span>
                  <strong className="text-emerald-700 font-bold">{log.calibratedPM25} µg/m³</strong>
                </div>

                <div>
                  <span className="text-slate-400">Temp: </span>
                  <span className="text-slate-500 dark:text-slate-400 line-through mr-1">{log.rawTemp}</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-bold">{log.calibratedTemp} °C</strong>
                </div>

                <span className="text-[10px] text-slate-400 font-mono">
                  {log.latencyMs}ms
                </span>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('iot.qaqcOk')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

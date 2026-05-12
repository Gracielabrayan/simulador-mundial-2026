"use client";

import React, { useState, useEffect } from 'react';
import { Metric, Text, Flex, Grid, ProgressBar, Title } from "@tremor/react";
import { Package, Calculator, Zap, Users, Target, Activity, Sparkles, Database, Download, BarChart3, Brain, Lightbulb, TerminalSquare } from "lucide-react";
import dynamic from 'next/dynamic';

// --- SOLUCIÓN PARA VERCEL: CARGA DINÁMICA DE GRÁFICOS ---
// @ts-ignore
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
// @ts-ignore
const RechartBarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
// @ts-ignore
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
// @ts-ignore
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
// @ts-ignore
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
// @ts-ignore
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
// @ts-ignore
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
// @ts-ignore
const ReferenceLine = dynamic(() => import('recharts').then(mod => mod.ReferenceLine), { ssr: false });

interface SimResults {
  promedio_simulado: number;
  promedio_teorico: number;
  data: number[];
}

function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(easeOutQuart * end);
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  return count;
}

const Typewriter = ({ text, delay = 20 }: { text: string, delay?: number }) => {
  const [currentText, setCurrentText] = useState('');
  useEffect(() => {
    setCurrentText('');
    let i = 0;
    const timer = setInterval(() => {
      setCurrentText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, delay);
    return () => clearInterval(timer);
  }, [text, delay]);
  return <span>{currentText}<span className="animate-pulse ml-1 inline-block w-2 h-4 bg-indigo-400"></span></span>;
};

const Frac = ({ top, bot }: { top: string, bot: string }) => (
  <span className="inline-flex flex-col text-center align-middle mx-1 text-[0.85em] font-serif">
    <span className="border-b border-current pb-[1px] leading-none">{top}</span>
    <span className="pt-[1px] leading-none">{bot}</span>
  </span>
);

export default function SimuladorUltraPro() {
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState<SimResults | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [hasSimulated, setHasSimulated] = useState(false);
  
  const [figusTotal, setFigusTotal] = useState(980);
  const [figusPaquete, setFigusPaquete] = useState(7);
  const [amigos, setAmigos] = useState(0);
  const [nSimulaciones, setNSimulaciones] = useState(100);
  const [semilla, setSemilla] = useState(123);

  const ejecutarSimulacion = async () => {
    setLoading(true);
    setHasSimulated(false);
    setActiveTab(0);
    
    const steps = [
      `> Inicializando Semilla Cuántica [${semilla}]...`,
      `> Generando pool de ${amigos} amigos...`,
      `> Abriendo ${figusTotal} variables de estado...`,
      `> Ejecutando Montecarlo Engine (${nSimulaciones} iteraciones)...`,
      `> Colapsando función de onda...`
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(i);
      await new Promise(r => setTimeout(r, 400));
    }

    try {
      const response = await fetch('https://simulador-mundial-2026.onrender.com/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          figus_total: figusTotal, figus_paquete: figusPaquete,
          amigos: amigos, n_simulaciones: nSimulaciones, semilla: semilla
        })
      });
      const data = await response.json();
      setResults(data);
      setHasSimulated(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const descargarCSV = () => {
    if (!results || !results.data) return;
    let csvContent = "data:text/csv;charset=utf-8,Iteracion,Paquetes_Comprados\n";
    results.data.forEach((paquetes: number, index: number) => {
      csvContent += `${index + 1},${paquetes}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `simulacion_album_seed${semilla}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ahorro = (results?.promedio_teorico && results.promedio_teorico > 0) 
    ? Math.round(((results.promedio_teorico - results.promedio_simulado) / results.promedio_teorico) * 100) : 0;

  const countSimulado = useCountUp(results?.promedio_simulado || 0);
  const countTeorico = useCountUp(results?.promedio_teorico || 0);
  const countAhorro = useCountUp(ahorro);

  let chartData: any[] = [];
  let closestTeorico = 0;
  let closestSimulado = 0;

  if (results && results.data) {
    const binSize = 25;
    const bins: Record<number, number> = {};
    let minVal = Math.floor(Math.min(...results.data) / binSize) * binSize;
    let maxVal = Math.ceil(Math.max(...results.data) / binSize) * binSize;
    for (let i = minVal; i <= maxVal; i += binSize) bins[i] = 0;
    results.data.forEach((val: number) => {
      const bin = Math.floor(val / binSize) * binSize;
      bins[bin] += 1;
    });
    chartData = Object.keys(bins).map(key => ({
      Paquetes: Number(key), Frecuencia: bins[Number(key)]
    }));
    closestTeorico = Math.round(results.promedio_teorico / binSize) * binSize;
    closestSimulado = Math.round(results.promedio_simulado / binSize) * binSize;
  }

  const generarInsight = () => {
    if (!results) return "";
    if (amigos === 0) return `En solitario, te enfrentas a la brutalidad de la campana de Gauss. Necesitas abrir aproximadamente ${results.promedio_simulado} paquetes para conseguir las ${figusTotal} figuritas. La eficiencia del sistema es baja porque el desperdicio de repetidas al final del álbum es masivo.`;
    if (ahorro > 50) return `¡Estrategia óptima detectada! Al formar un pool de ${amigos + 1} personas, has colapsado la volatilidad del sistema. Estás ahorrando un ${ahorro}% de paquetes respecto a hacerlo solo. Básicamente, el algoritmo de intercambio destruye la "cola larga" de figuritas difíciles.`;
    return `Al incorporar ${amigos} amigo(s), has optimizado el proceso un ${ahorro}%. El esfuerzo conjunto reduce la compra individual a ${Math.round(results.promedio_simulado / (amigos + 1))} paquetes por persona. Una clara victoria sobre la probabilidad teórica individual.`;
  };

  const EstadoVacio = ({ mensaje }: { mensaje: string }) => (
    <div className="h-full min-h-[500px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
      <Sparkles size={64} className="text-slate-700 mb-6 animate-pulse" />
      <Title className="text-slate-300 text-2xl font-bold mb-2">Base de Datos Inactiva</Title>
      <Text className="text-slate-500">{mensaje}</Text>
    </div>
  );

  return (
    <div className="dark min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-blue-500/30 relative overflow-x-hidden">
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-[1500px] mx-auto p-4 md:p-8 relative z-10">
        
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              Montecarlo Engine v3.0
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-indigo-400 tracking-tighter mb-2 drop-shadow-2xl">
              Álbum Mundial 2026
            </h1>
            <Text className="text-slate-400 text-lg font-medium">Un análisis probabilístico mediante simulaciones de Montecarlo</Text>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden sticky top-8 group">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
              
              <Title className="text-white mb-8 font-bold flex items-center gap-3 text-lg tracking-wide">
                <Target size={20} className="text-blue-400"/> SET DE PARÁMETROS
              </Title>

              <div className="space-y-8">
                {[
                  { label: "Tamaño del Álbum", value: figusTotal, setter: setFigusTotal, min: 100, max: 1200, step: 10 },
                  { label: "Figuritas por Paquete", value: figusPaquete, setter: setFigusPaquete, min: 1, max: 15, step: 1 },
                  { label: "Cantidad de amigos", value: amigos, setter: setAmigos, min: 0, max: 10, step: 1 },
                  { label: "Simulaciones (N)", value: nSimulaciones, setter: setNSimulaciones, min: 10, max: 500, step: 10 },
                  { label: "Semilla Cuántica", value: semilla, setter: setSemilla, min: 1, max: 9999, step: 1 }
                ].map((input, idx) => (
                  <div key={idx} className="space-y-3 relative">
                    <Flex className="text-sm">
                      <span className="text-slate-300 font-medium">{input.label}</span>
                      <span className="text-blue-300 font-mono font-bold bg-blue-900/40 px-2 py-1 rounded-lg border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        {input.value}
                      </span>
                    </Flex>
                    <input 
                      type="range" min={input.min} max={input.max} step={input.step} value={input.value} 
                      onChange={(e) => input.setter(Number(e.target.value))} 
                      className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all focus:outline-none shadow-[0_0_10px_rgba(59,130,246,0.3)]" 
                    />
                  </div>
                ))}
              </div>

              <button 
                onClick={ejecutarSimulacion}
                disabled={loading}
                className="w-full mt-10 relative group/btn overflow-hidden rounded-2xl p-[1px] transition-transform active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-[length:200%_auto] animate-gradient opacity-100 group-hover/btn:blur-sm transition-all duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-[length:200%_auto] animate-gradient opacity-100"></div>
                <div className="relative px-6 py-5 bg-slate-950/50 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3 text-white font-black tracking-widest text-sm hover:bg-transparent transition-all duration-300">
                  {loading ? <Activity className="animate-spin text-white" size={20} /> : <Zap size={20} className="text-yellow-400 group-hover/btn:scale-125 transition-transform" />}
                  {loading ? "PROCESANDO..." : "SIMULAR AHORA"}
                </div>
              </button>
            </div>
          </aside>

          <main className="lg:col-span-9">
            
            <div className="mb-8 p-2 bg-[#0f172a]/60 backdrop-blur-xl rounded-2xl border border-white/10 inline-flex flex-wrap gap-2 shadow-2xl relative z-20">
              {[
                { id: 0, icon: BarChart3, label: "Dashboard Interactivo", color: "blue" },
                { id: 1, icon: Brain, label: "Justificación Teórica", color: "purple" },
                { id: 2, icon: Database, label: "Datos Crudos", color: "rose" }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => !loading && setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 outline-none ${
                    activeTab === tab.id 
                      ? `text-white bg-${tab.color}-600/30 shadow-[0_0_20px_rgba(var(--tw-colors-${tab.color}-500),0.3)] border border-${tab.color}-500/50` 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <tab.icon size={18} className={activeTab === tab.id ? `text-${tab.color}-400 drop-shadow-md` : ''} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-h-[600px]">
              
              {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#030712]/80 backdrop-blur-md rounded-3xl border border-blue-500/30 animate-in zoom-in-95 duration-300 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                  <TerminalSquare size={64} className="text-blue-500 mb-6 animate-pulse" />
                  <div className="w-full max-w-md bg-black/80 rounded-xl p-6 border border-slate-800 font-mono text-sm text-green-400 shadow-2xl h-48 flex flex-col justify-end overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-green-500/50 animate-scan"></div>
                    {["Inicializando...", "Generando pool...", "Abriendo variables...", "Ejecutando Montecarlo...", "Colapsando función..."]
                      .slice(0, loadingStep + 1).map((text, i) => (
                      <div key={i} className="animate-in slide-in-from-bottom-2 fade-in duration-200 mb-2">
                        <span className="text-slate-500 mr-2">{'>'}</span>{text}
                      </div>
                    ))}
                    <span className="animate-pulse w-2 h-4 bg-green-400 mt-1 block"></span>
                  </div>
                </div>
              )}

              {/* PESTAÑA 0: DASHBOARD */}
              {!loading && activeTab === 0 && (
                !hasSimulated ? (
                  <EstadoVacio mensaje="Configure los parámetros a la izquierda e inicie la secuencia." />
                ) : (
                  <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000 space-y-8">
                    
                    <Grid numItemsMd={3} className="gap-6">
                      {[
                        { title: "Promedio Simulado", value: countSimulado, raw: results?.promedio_simulado || 0, icon: Package, color: "blue", sub: `Con ${amigos} amigos` },
                        { title: "Valor Teórico", value: countTeorico, raw: results?.promedio_teorico || 0, icon: Calculator, color: "yellow", sub: "Matemática Pura" },
                        { title: "Impacto del escenario", value: countAhorro, raw: ahorro, icon: Users, color: "emerald", sub: "Ahorro colaborativo", isProgress: true }
                      ].map((kpi, i) => (
                        <div key={i} className={`bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 hover:border-${kpi.color}-500/50 rounded-3xl p-8 shadow-2xl hover:shadow-[0_0_40px_rgba(var(--tw-colors-${kpi.color}-500),0.3)] transition-all duration-500 group relative overflow-hidden transform hover:-translate-y-1`}>
                          <div className={`absolute -right-10 -top-10 text-${kpi.color}-500/10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700`}><kpi.icon size={140}/></div>
                          <Flex justifyContent="start" className="gap-4 mb-4 relative z-10">
                            <div className={`p-3 bg-${kpi.color}-500/20 rounded-xl shadow-inner`}><kpi.icon className={`text-${kpi.color}-400`} size={24}/></div>
                            <Text className="text-slate-300 font-bold tracking-wide uppercase text-sm">{kpi.title}</Text>
                          </Flex>
                          <Metric className={`text-white text-5xl lg:text-6xl font-black mt-2 relative z-10 tracking-tighter ${kpi.isProgress ? `text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-600` : ''}`}>
                            {kpi.value.toFixed(1)} {kpi.isProgress ? '%' : ''}
                          </Metric>
                          <Text className="text-slate-400 font-medium mt-3 relative z-10">{kpi.sub}</Text>
                          {kpi.isProgress && <ProgressBar value={kpi.raw} color="emerald" className="mt-5 relative z-10 bg-slate-800" />}
                        </div>
                      ))}
                    </Grid>

                    <div className="bg-gradient-to-br from-indigo-900/40 via-[#0f172a]/90 to-black/80 border border-indigo-500/30 rounded-3xl p-8 relative overflow-hidden backdrop-blur-2xl shadow-[0_0_50px_rgba(99,102,241,0.15)]">
                      <div className="absolute top-0 right-0 p-8 opacity-20 animate-pulse"><Brain size={180} className="text-indigo-400" /></div>
                      <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)]"></div>
                      <Flex justifyContent="start" className="gap-4 mb-6 relative z-10 pl-4">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/40"><Lightbulb className="text-indigo-300" size={28} /></div>
                        <div>
                          <Title className="text-white font-black text-2xl tracking-wide">Inferencia de IA</Title>
                          <Text className="text-indigo-400 font-mono text-xs uppercase tracking-widest mt-1">Análisis Semántico Completado</Text>
                        </div>
                      </Flex>
                      <p className="text-indigo-100 leading-relaxed text-xl relative z-10 pl-4 max-w-4xl font-medium">
                        <Typewriter text={generarInsight()} delay={25} />
                      </p>
                    </div>

                    <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                      <Flex justifyContent="between" alignItems="center" className="mb-8">
                        <div>
                          <Title className="text-white text-2xl font-black tracking-tight">Distribución de Frecuencias</Title>
                          <Text className="text-slate-400 font-medium mt-1">Histograma de Paquetes Necesarios para llenar el álbum.</Text>
                        </div>
                        <div className="hidden md:flex gap-4 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                          <Flex className="gap-2 w-auto"><div className="w-4 h-1 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div><span className="text-slate-300 font-mono text-sm font-bold">Teórico</span></Flex>
                          <Flex className="gap-2 w-auto"><div className="w-4 h-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div><span className="text-slate-300 font-mono text-sm font-bold">Simulado</span></Flex>
                        </div>
                      </Flex>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height={400}>
                          <RechartBarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="Paquetes" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 600}} tickMargin={15} />
                            <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 600}} allowDecimals={false} />
                            <Tooltip cursor={{fill: '#1e293b', opacity: 0.6}} contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', color: '#f8fafc', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.8)', padding: '12px 20px' }} />
                            <Bar dataKey="Frecuencia" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={45} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <ReferenceLine x={closestTeorico} stroke="#eab308" strokeWidth={3} strokeDasharray="6 6" />
                            <ReferenceLine x={closestSimulado} stroke="#ef4444" strokeWidth={3} />
                          </RechartBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* PESTAÑA 1: TEORÍA */}
              {!loading && activeTab === 1 && (
                <div className="animate-in slide-in-from-right-8 fade-in duration-700 space-y-8">
                  <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full"></div>
                    <h3 className="text-3xl font-black text-white mb-6 tracking-tight relative z-10">¿De dónde sale el Valor Teórico?</h3>
                    <p className="text-slate-300 text-xl leading-relaxed relative z-10 mb-6">
                      El problema de llenar el álbum es una variación del clásico <strong>Problema del Coleccionista de Cupones</strong>.
                    </p>
                    <p className="text-slate-300 text-xl leading-relaxed relative z-10 mb-6">
                      Si el álbum tiene <em className="text-purple-400 font-serif not-italic font-bold">n</em> figuritas, la probabilidad de que la primera figurita sea nueva es <Frac top="n" bot="n" />. La probabilidad de que la segunda sea nueva es <Frac top="n-1" bot="n" />, y así sucesivamente hasta la última figurita, cuya probabilidad de salir es <Frac top="1" bot="n" />.
                    </p>
                    <p className="text-slate-300 text-xl leading-relaxed relative z-10">
                      La <strong>Esperanza Matemática</strong> (promedio de intentos) para llenar el álbum de <em className="text-purple-400 font-serif not-italic font-bold">n</em> figuritas individuales es la suma de las inversas de esas probabilidades:
                    </p>
                    
                    <div className="bg-[#030712]/80 p-8 rounded-3xl font-serif text-center text-3xl md:text-4xl text-purple-400 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] border border-purple-500/20 my-10 overflow-x-auto relative z-10 hover:border-purple-500/50 transition-colors flex items-center justify-center">
                      <span className="whitespace-nowrap font-bold drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-center justify-center gap-3">
                        <span>E = <em className="not-italic">n</em> × (</span>
                        <Frac top="1" bot="1" /> <span>+</span> <Frac top="1" bot="2" /> <span>+</span> <Frac top="1" bot="3" /> <span className="tracking-[0.3em] font-sans">&middot;&middot;&middot;</span> <span>+</span> <Frac top="1" bot="n" />
                        <span>)</span>
                      </span>
                    </div>

                    <p className="text-slate-300 text-xl leading-relaxed relative z-10">
                      Como en la realidad los paquetes traen figuritas juntas (y asumiendo simplificadamente que no vienen repetidas en el mismo paquete), dividimos el resultado final por la cantidad de figuritas por paquete.
                    </p>
                  </div>

                  <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[80px] rounded-full"></div>
                    <h3 className="text-3xl font-black text-white mb-6 flex items-center gap-4 tracking-tight relative z-10">
                      🤝 El Impacto del Intercambio (Montecarlo)
                    </h3>
                    <p className="text-slate-300 text-xl leading-relaxed relative z-10 mb-6">
                      Mientras que el Valor Teórico calcula el esfuerzo de una persona sola, la simulación de <strong>Montecarlo</strong> nos permite introducir variables sociales.
                    </p>
                    <p className="text-slate-300 text-xl leading-relaxed relative z-10 mb-6">
                      En este modelo, el "Intercambio" se simplifica bajo la siguiente lógica:
                    </p>
                    <ul className="list-disc list-inside text-slate-300 text-xl space-y-4 ml-4 md:ml-8 marker:text-emerald-500 relative z-10 mb-8 font-medium">
                      <li><strong>Simultaneidad:</strong> Tus amigos compran paquetes al mismo tiempo que tú.</li>
                      <li><strong>Cero desperdicio:</strong> Si un amigo saca una figurita que tú no tienes, te la entrega inmediatamente.</li>
                    </ul>
                    <div className="bg-emerald-900/20 p-8 rounded-3xl border border-emerald-500/30 relative z-10">
                      <p className="text-emerald-100 text-xl leading-relaxed">
                        <strong className="text-emerald-400 font-black">¿Por qué baja tanto el promedio?</strong> Matemáticamente, estamos aumentando la cantidad de "intentos" por unidad de tiempo sin aumentar tu costo personal. Si tienes {amigos > 0 ? amigos : 5} amigos, en cada ronda de compra se abren {amigos > 0 ? amigos + 1 : 6} paquetes buscando las figuritas que te faltan a ti. Esto reduce drásticamente la "cola" de la distribución, evitando que te quedes estancado buscando las últimas 10 figuritas difíciles durante semanas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: DATOS CRUDOS */}
              {!loading && activeTab === 2 && (
                !hasSimulated ? (
                  <EstadoVacio mensaje="Ejecute la simulación primero para poblar la matriz de datos." />
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in slide-in-from-right-8 fade-in duration-700">
                    <div className="lg:col-span-2 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                      <div className="bg-slate-900/80 p-6 border-b border-white/10">
                        <Title className="text-white font-bold flex items-center gap-2"><Database size={20} className="text-rose-400" /> Datos crudos de la simulación</Title>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto custom-scrollbar bg-[#030712]/50">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-[#0f172a] sticky top-0 z-10 border-b border-white/10 shadow-md">
                            <tr>
                              <th className="py-5 px-8 text-slate-400 font-bold text-sm tracking-wider uppercase">Iteración</th>
                              <th className="py-5 px-8 text-slate-400 font-bold text-sm text-right tracking-wider uppercase">Paquetes Comprados</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {results?.data.map((val: number, i: number) => (
                              <tr key={i} className="hover:bg-white/[0.05] transition-colors">
                                <td className="py-4 px-8 text-slate-300 font-mono text-base">{i + 1}</td>
                                <td className="py-4 px-8 text-rose-400 font-mono font-bold text-lg text-right">{val}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="lg:col-span-3 flex flex-col justify-center bg-gradient-to-br from-[#0f172a]/80 to-rose-950/20 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl relative overflow-hidden group">
                      <div className="absolute -bottom-20 -right-20 text-rose-500/10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-1000"><Download size={400} /></div>
                      <div className="absolute top-0 left-0 w-2 h-full bg-rose-500 shadow-[0_0_30px_rgba(244,63,94,1)]"></div>
                      <h3 className="text-4xl font-black text-white mb-6 relative z-10 tracking-tight">📥 Exportar Resultados</h3>
                      <p className="text-slate-300 text-xl mb-12 leading-relaxed relative z-10 max-w-lg">
                        Descargá la tabla completa de la simulación en formato CSV para documentar tu investigación o abrirla en Excel.
                      </p>
                      <button
                        onClick={descargarCSV}
                        className="w-fit relative group/export overflow-hidden rounded-2xl z-10 hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(244,63,94,0.3)]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-600 opacity-90 group-hover/export:opacity-100 transition-opacity"></div>
                        <div className="relative px-10 py-5 flex items-center justify-center gap-4 text-white font-black tracking-widest text-lg">
                          <Download size={24} />
                          Descargar datos en CSV
                        </div>
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ESTILOS GLOBALES */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; border: 2px solid rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 2s linear infinite; }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient { animation: gradient 3s ease infinite; }
      `}} />
    </div>
  );
}
"use client";

import React, { useState, useEffect } from 'react';
import { Metric, Text, Flex, Grid, ProgressBar, Title } from "@tremor/react";
import { Package, Calculator, Zap, Users, Target, Activity, Sparkles, Database, Download, BarChart3, Brain, Lightbulb, TerminalSquare } from "lucide-react";
import dynamic from 'next/dynamic';

// --- IMPORTACIONES DINÁMICAS CON TS-IGNORE PARA VERCEL ---
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
      if (progress < 1) animationFrame = window.requestAnimationFrame(step);
      else setCount(end);
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
  
  // PARCHE CRÍTICO: SOLO RENDERIZAR GRÁFICO SI ESTÁ MONTADO
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    setMontado(true);
  }, []);

  const [figusTotal, setFigusTotal] = useState(980);
  const [figusPaquete, setFigusPaquete] = useState(7);
  const [amigos, setAmigos] = useState(0);
  const [nSimulaciones, setNSimulaciones] = useState(100);
  const [semilla, setSemilla] = useState(123);

  const ejecutarSimulacion = async () => {
    setLoading(true);
    setHasSimulated(false);
    setActiveTab(0);
    const steps = [`> Iniciando...`, `> Generando pool...`, `> Ejecutando Montecarlo...` ];
    for (let i = 0; i < steps.length; i++) {
      setLoadingStep(i);
      await new Promise(r => setTimeout(r, 400));
    }
    try {
      const response = await fetch('https://simulador-mundial-2026.onrender.com/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figus_total: figusTotal, figus_paquete: figusPaquete, amigos, n_simulaciones: nSimulaciones, semilla })
      });
      const data = await response.json();
      setResults(data);
      setHasSimulated(true);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const descargarCSV = () => {
    if (!results) return;
    let csvContent = "data:text/csv;charset=utf-8,Iteracion,Paquetes\n";
    results.data.forEach((p, i) => csvContent += `${i + 1},${p}\n`);
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `simulacion.csv`);
    link.click();
  };

  const ahorro = (results?.promedio_teorico) ? Math.round(((results.promedio_teorico - results.promedio_simulado) / results.promedio_teorico) * 100) : 0;
  const countSimulado = useCountUp(results?.promedio_simulado || 0);
  const countTeorico = useCountUp(results?.promedio_teorico || 0);
  const countAhorro = useCountUp(ahorro);

  let chartData: any[] = [];
  let closestTeorico = 0, closestSimulado = 0;
  if (results) {
    const binSize = 25;
    const bins: Record<number, number> = {};
    results.data.forEach(val => {
      const bin = Math.floor(val / binSize) * binSize;
      bins[bin] = (bins[bin] || 0) + 1;
    });
    chartData = Object.keys(bins).map(k => ({ Paquetes: Number(k), Frecuencia: bins[Number(k)] })).sort((a,b) => a.Paquetes - b.Paquetes);
    closestTeorico = Math.round(results.promedio_teorico / binSize) * binSize;
    closestSimulado = Math.round(results.promedio_simulado / binSize) * binSize;
  }

  const generarInsight = () => {
    if (!results) return "";
    return amigos === 0 ? `En solitario necesitas unos ${results.promedio_simulado.toFixed(0)} paquetes.` : `Ahorras un ${ahorro}% con amigos.`;
  };

  return (
    <div className="dark min-h-screen bg-[#030712] text-slate-200 p-4 md:p-8 relative">
      <div className="fixed inset-0 z-0 bg-[size:60px_60px] opacity-20 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]"></div>
      
      <div className="max-w-[1500px] mx-auto relative z-10">
        <header className="mb-10 border-b border-white/10 pb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400 tracking-tighter">Álbum Mundial 2026</h1>
            <Text className="text-slate-400">Simulación de Montecarlo</Text>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3">
            <div className="bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl sticky top-8">
              <Title className="text-white mb-8 flex items-center gap-3"><Target size={20} className="text-blue-400"/> PARÁMETROS</Title>
              <div className="space-y-8">
                {[
                  { label: "Tamaño Álbum", value: figusTotal, setter: setFigusTotal, min: 100, max: 1200 },
                  { label: "Figus x Paquete", value: figusPaquete, setter: setFigusPaquete, min: 1, max: 15 },
                  { label: "Amigos", value: amigos, setter: setAmigos, min: 0, max: 10 },
                  { label: "Simulaciones", value: nSimulaciones, setter: setNSimulaciones, min: 10, max: 500 }
                ].map((input, idx) => (
                  <div key={idx} className="space-y-3">
                    <Flex className="text-sm"><span className="text-slate-300">{input.label}</span><span className="text-blue-300 font-mono font-bold">{input.value}</span></Flex>
                    <input type="range" min={input.min} max={input.max} value={input.value} onChange={(e) => input.setter(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500" />
                  </div>
                ))}
              </div>
              <button onClick={ejecutarSimulacion} disabled={loading} className="w-full mt-10 p-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2">
                {loading ? <Activity className="animate-spin" /> : <Zap size={20} />} {loading ? "PROCESANDO..." : "SIMULAR AHORA"}
              </button>
            </div>
          </aside>

          <main className="lg:col-span-9 space-y-8">
            <div className="flex gap-2 p-2 bg-[#0f172a]/60 rounded-2xl border border-white/10 w-fit">
              {["Dashboard", "Teoría", "Datos"].map((l, i) => (
                <button key={i} onClick={() => setActiveTab(i)} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === i ? 'bg-blue-600/30 text-white border border-blue-500 shadow-lg' : 'text-slate-400 hover:text-white'}`}>{l}</button>
              ))}
            </div>

            {loading && (
              <div className="h-96 flex flex-col items-center justify-center bg-[#0f172a]/40 rounded-3xl border border-blue-500/20">
                <TerminalSquare size={48} className="text-blue-500 mb-4 animate-pulse" />
                <div className="font-mono text-green-400 text-sm animate-in fade-in">{`> ${[`Cargando núcleos...`, `Simulando...`, `Finalizando...`][loadingStep]}`}</div>
              </div>
            )}

            {!loading && activeTab === 0 && (
              !hasSimulated ? <div className="h-96 flex items-center justify-center border border-dashed border-white/10 rounded-3xl text-slate-500 italic text-lg">Ajuste parámetros y presione simular</div> :
              <div className="space-y-8 animate-in fade-in duration-1000">
                <Grid numItemsMd={3} className="gap-6">
                  <div className="bg-[#0f172a]/80 p-8 rounded-3xl border border-white/10 shadow-xl"><Text className="text-slate-400 font-bold uppercase text-xs mb-2">Simulado</Text><Metric className="text-white text-5xl font-black tracking-tighter">{countSimulado.toFixed(1)}</Metric></div>
                  <div className="bg-[#0f172a]/80 p-8 rounded-3xl border border-white/10 shadow-xl"><Text className="text-slate-400 font-bold uppercase text-xs mb-2">Teórico</Text><Metric className="text-white text-5xl font-black tracking-tighter">{countTeorico.toFixed(1)}</Metric></div>
                  <div className="bg-[#0f172a]/80 p-8 rounded-3xl border border-white/10 shadow-xl"><Text className="text-slate-400 font-bold uppercase text-xs mb-2">Ahorro</Text><Metric className="text-emerald-400 text-5xl font-black tracking-tighter">{countAhorro}%</Metric><ProgressBar value={ahorro} color="emerald" className="mt-5" /></div>
                </Grid>

                <div className="bg-[#0f172a]/80 p-8 rounded-3xl border border-white/10 shadow-2xl">
                  <Title className="text-white mb-8">Distribución de Frecuencias</Title>
                  {/* CONTENEDOR CON ALTURA FIJA PARA EVITAR COLAPSO EN VERCEL */}
                  <div style={{ height: '400px', width: '100%', minHeight: '400px' }}>
                    {montado && (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid stroke="#1e293b" vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="Paquetes" stroke="#64748b" tick={{fontSize: 12}} />
                          <YAxis stroke="#64748b" tick={{fontSize: 12}} />
                          <Tooltip contentStyle={{backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '12px'}} />
                          <Bar dataKey="Frecuencia" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                          <ReferenceLine x={closestTeorico} stroke="#eab308" strokeWidth={3} strokeDasharray="6 6" />
                          <ReferenceLine x={closestSimulado} stroke="#ef4444" strokeWidth={3} />
                        </RechartBarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="bg-blue-900/20 p-8 rounded-3xl border border-blue-500/30 flex items-center gap-6">
                  <div className="p-4 bg-blue-500/20 rounded-2xl"><Lightbulb className="text-blue-400" /></div>
                  <p className="text-blue-100 text-lg font-medium leading-relaxed"><Typewriter text={generarInsight()} delay={30} /></p>
                </div>
              </div>
            )}
            
            {activeTab === 1 && (
              <div className="bg-[#0f172a] p-10 rounded-3xl border border-white/10 space-y-6 animate-in slide-in-from-right-8 fade-in">
                <h3 className="text-3xl font-black text-white">Justificación Teórica</h3>
                <p className="text-slate-300 text-xl leading-relaxed">Este modelo aplica el problema del coleccionista de cupones para predecir el comportamiento del mercado de figuritas.</p>
                <div className="bg-black/40 p-8 rounded-2xl text-center text-3xl text-blue-400 font-serif italic border border-blue-500/10">
                   E = n × ( <Frac top="1" bot="1" /> + <Frac top="1" bot="2" /> + ... + <Frac top="1" bot="n" /> )
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="bg-[#0f172a] rounded-3xl border border-white/10 overflow-hidden animate-in slide-in-from-right-8 fade-in">
                <Flex className="p-6 border-b border-white/10"><Title className="text-white">Matriz de Datos</Title><button onClick={descargarCSV} className="text-blue-400 flex items-center gap-2 hover:text-white transition-all font-bold"><Download size={18}/> Descargar CSV</button></Flex>
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left"><thead className="bg-slate-900/50 text-slate-400 text-xs font-bold uppercase tracking-widest sticky top-0"><tr className="border-b border-white/5"><th className="p-6 font-black">ID Iteración</th><th className="p-6 text-right font-black">Paquetes Totales</th></tr></thead><tbody className="divide-y divide-white/5">{results?.data.map((v, i) => (<tr key={i} className="hover:bg-white/[0.02] transition-colors"><td className="p-6 text-slate-400 font-mono tracking-tighter text-sm italic">SIM_REF_{i+1}</td><td className="p-6 text-right text-blue-300 font-mono font-black text-lg">{v}</td></tr>))}</tbody></table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
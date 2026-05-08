"use client";

import React, { useState, useEffect } from 'react';
import { Metric, Text, Flex, Grid, ProgressBar, Title } from "@tremor/react";
import { Package, Calculator, Zap, Users, Target, Activity, Sparkles, Database, Download, BarChart3, Brain, Lightbulb, TerminalSquare } from "lucide-react";
import dynamic from 'next/dynamic';

// IMPORTACIÓN DINÁMICA PARA MATAR EL ERROR DE VERCEL
const RechartBarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ReferenceLine = dynamic(() => import('recharts').then(mod => mod.ReferenceLine), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

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
  
  const [figusTotal, setFigusTotal] = useState(980);
  const [figusPaquete, setFigusPaquete] = useState(7);
  const [amigos, setAmigos] = useState(0);
  const [nSimulaciones, setNSimulaciones] = useState(100);
  const [semilla, setSemilla] = useState(123);

  const ejecutarSimulacion = async () => {
    setLoading(true);
    setHasSimulated(false);
    setActiveTab(0);
    const steps = [`> Inicializando...`, `> Generando pool...`, `> Abriendo variables...`, `> Ejecutando Montecarlo...`, `> Colapsando función...` ];
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
    let csvContent = "data:text/csv;charset=utf-8,Iteracion,Paquetes_Comprados\n";
    results.data.forEach((p, i) => csvContent += `${i + 1},${p}\n`);
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `simulacion_seed${semilla}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="dark min-h-screen bg-[#030712] text-slate-200 p-4 md:p-8 relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      
      <div className="max-w-[1500px] mx-auto relative z-10">
        <header className="mb-10 border-b border-white/10 pb-8">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Álbum Mundial 2026</h1>
          <Text className="text-slate-400 text-lg">Simulación de Montecarlo</Text>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl sticky top-8">
              <Title className="text-white mb-8 flex items-center gap-3"><Target size={20}/> PARÁMETROS</Title>
              <div className="space-y-8">
                {[
                  { label: "Figuritas Álbum", value: figusTotal, setter: setFigusTotal, min: 100, max: 1200 },
                  { label: "Por Paquete", value: figusPaquete, setter: setFigusPaquete, min: 1, max: 15 },
                  { label: "Amigos", value: amigos, setter: setAmigos, min: 0, max: 10 },
                  { label: "Simulaciones", value: nSimulaciones, setter: setNSimulaciones, min: 10, max: 500 }
                ].map((input, idx) => (
                  <div key={idx} className="space-y-3">
                    <Flex className="text-sm"><span className="text-slate-300">{input.label}</span><span className="text-blue-400 font-bold">{input.value}</span></Flex>
                    <input type="range" min={input.min} max={input.max} value={input.value} onChange={(e) => input.setter(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full accent-blue-500" />
                  </div>
                ))}
              </div>
              <button onClick={ejecutarSimulacion} disabled={loading} className="w-full mt-10 p-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
                {loading ? <Activity className="animate-spin" /> : <Zap size={20} />} {loading ? "PROCESANDO..." : "SIMULAR"}
              </button>
            </div>
          </aside>

          <main className="lg:col-span-9">
            <div className="mb-8 flex gap-2">
              {["Dashboard", "Teoría", "Datos"].map((l, i) => (
                <button key={i} onClick={() => setActiveTab(i)} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === i ? 'bg-blue-600/30 text-white border border-blue-500' : 'text-slate-400 hover:bg-white/5'}`}>{l}</button>
              ))}
            </div>

            <div className="relative min-h-[600px]">
              {activeTab === 0 && (
                !hasSimulated ? <div className="text-center py-20 text-slate-500">Inicie la simulación para ver resultados</div> :
                <div className="space-y-8 animate-in fade-in">
                  <Grid numItemsMd={3} className="gap-6">
                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/10"><Text>Promedio Simulado</Text><Metric className="text-white">{countSimulado.toFixed(1)}</Metric></div>
                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/10"><Text>Valor Teórico</Text><Metric className="text-white">{countTeorico.toFixed(1)}</Metric></div>
                    <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/10"><Text>Ahorro</Text><Metric className="text-emerald-400">{countAhorro}%</Metric></div>
                  </Grid>

                  <div className="bg-[#0f172a] p-8 rounded-3xl border border-white/10">
                    <Title className="text-white mb-6">Distribución de Frecuencias</Title>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartBarChart data={chartData}>
                          <CartesianGrid stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="Paquetes" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip contentStyle={{backgroundColor: '#020617', border: '1px solid #334155'}} />
                          <Bar dataKey="Frecuencia" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <ReferenceLine x={closestTeorico} stroke="#eab308" label={{value: 'Teórico', fill: '#eab308', position: 'top'}} />
                          <ReferenceLine x={closestSimulado} stroke="#ef4444" label={{value: 'Simulado', fill: '#ef4444', position: 'top'}} />
                        </RechartBarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 1 && (
                <div className="bg-[#0f172a] p-10 rounded-3xl border border-white/10 space-y-6">
                  <h3 className="text-3xl font-bold text-white">Modelo Matemático</h3>
                  <p className="text-slate-300">Basado en el Problema del Coleccionista de Cupones:</p>
                  <div className="p-8 bg-black/50 rounded-2xl text-center text-3xl text-purple-400 font-serif italic">
                    E = n × (1/1 + 1/2 + ... + 1/n)
                  </div>
                </div>
              )}
              {activeTab === 2 && (
                <div className="bg-[#0f172a] rounded-3xl border border-white/10 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold"><tr className="border-b border-white/5"><th className="p-6">Iteración</th><th className="p-6 text-right">Paquetes</th></tr></thead>
                    <tbody className="divide-y divide-white/5">{results?.data.map((v, i) => (<tr key={i}><td className="p-6 text-slate-300">#{i+1}</td><td className="p-6 text-right text-blue-400 font-mono">{v}</td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
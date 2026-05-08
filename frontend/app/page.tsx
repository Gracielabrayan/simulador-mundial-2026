"use client";

import React, { useState, useEffect } from 'react';
import { Metric, Text, Flex, Grid, ProgressBar, Title } from "@tremor/react";
import { Package, Calculator, Zap, Users, Target, Activity, Sparkles, Database, Download, BarChart3, Brain, Lightbulb, TerminalSquare } from "lucide-react";
import { BarChart as RechartBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

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
  }, [end]); // Cambiado para evitar loops
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
    const steps = [`> Iniciando...`, `> Generando pool...`, `> Abriendo variables...`, `> Ejecutando Montecarlo...`, `> Colapsando función...` ];
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
    } catch (e) { console.error(e); }
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
    link.setAttribute("download", `simulacion_seed${semilla}.csv`);
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
    const minVal = Math.floor(Math.min(...results.data) / binSize) * binSize;
    const maxVal = Math.ceil(Math.max(...results.data) / binSize) * binSize;
    for (let i = minVal; i <= maxVal; i += binSize) bins[i] = 0;
    results.data.forEach((val: number) => {
      const bin = Math.floor(val / binSize) * binSize;
      bins[bin] += 1;
    });
    chartData = Object.keys(bins).map(key => ({
      Paquetes: Number(key), Frecuencia: bins[Number(key)]
    }));
    closestTeorico = Math.round((results?.promedio_teorico || 0) / binSize) * binSize;
    closestSimulado = Math.round((results?.promedio_simulado || 0) / binSize) * binSize;
  }

  const generarInsight = () => {
    if (!results) return "";
    if (amigos === 0) return `En solitario, necesitas abrir aproximadamente ${results.promedio_simulado} paquetes para conseguir las ${figusTotal} figuritas.`;
    return `Al incorporar ${amigos} amigo(s), has optimizado el proceso un ${ahorro}%.`;
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
      </div>
      <div className="max-w-[1500px] mx-auto p-4 md:p-8 relative z-10">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8">
          <div><h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-indigo-400 tracking-tighter mb-2">Álbum Mundial 2026</h1><Text className="text-slate-400 text-lg font-medium">Análisis probabilístico de Montecarlo</Text></div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-[#0f172a]/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl relative sticky top-8 group">
              <Title className="text-white mb-8 font-bold flex items-center gap-3 text-lg"><Target size={20} className="text-blue-400"/> PARÁMETROS</Title>
              <div className="space-y-8">
                {[
                  { label: "Tamaño Álbum", value: figusTotal, setter: setFigusTotal, min: 100, max: 1200, step: 10 },
                  { label: "Figus x Paquete", value: figusPaquete, setter: setFigusPaquete, min: 1, max: 15, step: 1 },
                  { label: "Amigos", value: amigos, setter: setAmigos, min: 0, max: 10, step: 1 },
                  { label: "Simulaciones", value: nSimulaciones, setter: setNSimulaciones, min: 10, max: 500, step: 10 },
                  { label: "Semilla", value: semilla, setter: setSemilla, min: 1, max: 9999, step: 1 }
                ].map((input, idx) => (
                  <div key={idx} className="space-y-3">
                    <Flex className="text-sm"><span className="text-slate-300">{input.label}</span><span className="text-blue-300 font-mono font-bold bg-blue-900/40 px-2 py-1 rounded-lg border border-blue-500/30">{input.value}</span></Flex>
                    <input type="range" min={input.min} max={input.max} step={input.step} value={input.value} onChange={(e) => input.setter(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500" />
                  </div>
                ))}
              </div>
              <button onClick={ejecutarSimulacion} disabled={loading} className="w-full mt-10 relative group/btn overflow-hidden rounded-2xl p-[1px]">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-gradient opacity-100"></div>
                <div className="relative px-6 py-5 bg-slate-950/50 rounded-2xl flex items-center justify-center gap-3 text-white font-black tracking-widest text-sm">{loading ? <Activity className="animate-spin" size={20} /> : <Zap size={20} className="text-yellow-400" />}{loading ? "SIMULANDO..." : "SIMULAR AHORA"}</div>
              </button>
            </div>
          </aside>
          <main className="lg:col-span-9">
            <div className="mb-8 p-2 bg-[#0f172a]/60 backdrop-blur-xl rounded-2xl border border-white/10 inline-flex flex-wrap gap-2 shadow-2xl relative z-20">
              {["Dashboard", "Teoría", "Datos"].map((label, id) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`px-6 py-3 rounded-xl font-bold transition-all ${activeTab === id ? 'text-white bg-blue-600/30 border border-blue-500/50 shadow-lg' : 'text-slate-400 hover:text-white'}`}>{label}</button>
              ))}
            </div>
            <div className="relative min-h-[600px]">
              {loading && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#030712]/80 backdrop-blur-md rounded-3xl border border-blue-500/30">
                  <TerminalSquare size={64} className="text-blue-500 mb-6 animate-pulse" />
                  <div className="w-full max-w-md bg-black/80 rounded-xl p-6 border border-slate-800 font-mono text-sm text-green-400 h-48 flex flex-col justify-end overflow-hidden">
                    {[`Iniciando...`, `Simulando...`, `Colapsando...`].slice(0, loadingStep + 1).map((t, i) => (
                      <div key={i} className="mb-2 animate-in slide-in-from-bottom-2 fade-in">{`> ${t}`}</div>
                    ))}
                  </div>
                </div>
              )}
              {!loading && activeTab === 0 && (
                !hasSimulated ? <EstadoVacio mensaje="Ajustá los parámetros y simulá para ver los resultados." /> : (
                  <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000 space-y-8">
                    <Grid numItemsMd={3} className="gap-6">
                      <div className="bg-[#0f172a]/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <Flex justifyContent="start" className="gap-4 mb-4"><Package className="text-blue-400" size={24}/><Text className="text-slate-300 font-bold uppercase text-sm">Simulado</Text></Flex>
                        <Metric className="text-white text-4xl md:text-5xl font-black mt-2 tracking-tighter">{countSimulado.toFixed(1)}</Metric>
                      </div>
                      <div className="bg-[#0f172a]/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <Flex justifyContent="start" className="gap-4 mb-4"><Calculator className="text-yellow-400" size={24}/><Text className="text-slate-300 font-bold uppercase text-sm">Teórico</Text></Flex>
                        <Metric className="text-white text-4xl md:text-5xl font-black mt-2 tracking-tighter">{countTeorico.toFixed(1)}</Metric>
                      </div>
                      <div className="bg-[#0f172a]/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <Flex justifyContent="start" className="gap-4 mb-4"><Users className="text-emerald-400" size={24}/><Text className="text-slate-300 font-bold uppercase text-sm">Eficiencia</Text></Flex>
                        <Metric className="text-emerald-400 text-4xl md:text-5xl font-black mt-2 tracking-tighter">{countAhorro.toFixed(1)}%</Metric>
                        <ProgressBar value={ahorro} color="emerald" className="mt-5 bg-slate-800" />
                      </div>
                    </Grid>
                    <div className="bg-gradient-to-br from-indigo-900/40 via-[#0f172a]/90 to-black/80 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-2xl">
                      <Flex justifyContent="start" className="gap-4 mb-6 pl-4"><div className="p-3 bg-indigo-500/20 rounded-2xl"><Lightbulb className="text-indigo-300" size={28} /></div><Title className="text-white font-black text-2xl">IA Insight</Title></Flex>
                      <p className="text-indigo-100 text-xl pl-4 font-medium"><Typewriter text={generarInsight()} /></p>
                    </div>
                    <div className="bg-[#0f172a]/80 border border-white/10 rounded-3xl p-8 shadow-2xl">
                      <Title className="text-white text-2xl font-black mb-8">Distribución de Frecuencias</Title>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartBarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="Paquetes" stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 13}} />
                            <YAxis stroke="#64748b" tick={{fill: '#94a3b8', fontSize: 13}} />
                            <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155' }} />
                            <Bar dataKey="Frecuencia" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={45} />
                            <ReferenceLine x={closestTeorico} stroke="#eab308" strokeWidth={3} strokeDasharray="6 6" />
                            <ReferenceLine x={closestSimulado} stroke="#ef4444" strokeWidth={3} />
                          </RechartBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )
              )}
              {!loading && activeTab === 1 && (
                <div className="animate-in slide-in-from-right-8 fade-in duration-700 space-y-8">
                  <div className="bg-[#0f172a]/80 border border-white/10 rounded-3xl p-10 shadow-2xl">
                    <h3 className="text-3xl font-black text-white mb-6">El Problema del Coleccionista</h3>
                    <p className="text-slate-300 text-xl leading-relaxed mb-6">Si el álbum tiene <i>n</i> figuritas, la probabilidad de que la primera sea nueva es <Frac top="n" bot="n" />. La segunda <Frac top="n-1" bot="n" />, y así hasta <Frac top="1" bot="n" />.</p>
                    <div className="bg-[#030712]/80 p-10 rounded-3xl text-3xl text-purple-400 border border-purple-500/20 text-center font-serif font-bold">
                      E = n × ( <Frac top="1" bot="1" /> + <Frac top="1" bot="2" /> + ... + <Frac top="1" bot="n" /> )
                    </div>
                    <p className="text-slate-300 text-xl leading-relaxed mt-6">Como los paquetes traen figuritas juntas, dividimos el resultado final por la cantidad de figuritas por paquete.</p>
                  </div>
                </div>
              )}
              {!loading && activeTab === 2 && (
                !hasSimulated ? <EstadoVacio mensaje="Extraé datos ejecutando una simulación." /> : (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in slide-in-from-right-8 fade-in duration-700">
                    <div className="lg:col-span-2 bg-[#0f172a]/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                      <div className="max-h-[500px] overflow-y-auto custom-scrollbar bg-[#030712]/50">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-[#0f172a] sticky top-0 z-10 border-b border-white/10"><tr><th className="py-5 px-8 text-slate-400 font-bold uppercase">Iteración</th><th className="py-5 px-8 text-slate-400 font-bold text-right uppercase">Costo</th></tr></thead>
                          <tbody className="divide-y divide-white/5">{results?.data.map((val, i) => (<tr key={i} className="hover:bg-white/[0.05]"><td className="py-4 px-8 text-slate-300 font-mono">{i + 1}</td><td className="py-4 px-8 text-rose-400 font-mono font-bold text-right">{val}</td></tr>))}</tbody>
                        </table>
                      </div>
                    </div>
                    <div className="lg:col-span-3 flex flex-col justify-center bg-gradient-to-br from-[#0f172a]/80 to-rose-950/20 border border-white/10 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
                      <h3 className="text-4xl font-black text-white mb-6">Extracción de Datos</h3>
                      <button onClick={descargarCSV} className="w-fit relative rounded-2xl bg-rose-600 px-10 py-5 text-white font-black text-lg hover:scale-105 transition-transform">DESCARGAR CSV</button>
                    </div>
                  </div>
                )
              )}
            </div>
          </main>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: ` .custom-scrollbar::-webkit-scrollbar { width: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; } @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } .animate-gradient { animation: gradient 3s ease infinite; background-size: 200% auto; } `}} />
    </div>
  );
}
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { CloudRain, Droplets, Thermometer, Wind, RefreshCw, Activity, Home, Clock } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Type definition for readings
type Reading = {
    id: number;
    created_at: string;
    temperature: number;
    humidity: number;
};

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
        <div className={cn("glass rounded-2xl p-6 transition-transform duration-300 hover:scale-[1.02]", className)}>
            {children}
        </div>
    );
};

export default function WeatherDashboard() {
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [mounted, setMounted] = useState(false);
    const [visibleCount, setVisibleCount] = useState(20);

    // Drag to scroll state
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftState, setScrollLeftState] = useState(0);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            setVisibleCount((prev) => Math.min(prev + 20, readings.length));
        }
    };

    useEffect(() => {
        setMounted(true);
        setLastUpdated(new Date());
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('readings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3000);

            if (error) {
                console.error('Supabase error:', JSON.stringify(error, null, 2));
                console.error('Error details:', error.message, error.details, error.hint);
            }

            if (data) {
                console.log('Raw Supabase Data:', data);
                // Map database columns (temp, hum) to our component state (temperature, humidity)
                const mappedReadings = data.map((item: any, index: number) => ({
                    id: item.id ?? `reading-${index}`,
                    created_at: item.created_at,
                    // Handle both naming conventions just in case
                    temperature: item.temp ?? item.temperature ?? 0,
                    humidity: item.hum ?? item.humidity ?? 0
                }));
                setReadings(mappedReadings);
                setLastUpdated(new Date());
                setVisibleCount(20); // Reset on new fetch
            }
        } catch (err) {
            console.error('Fetch error:', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // Simulate live updates every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeftState(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Scroll-fast multiplier
        scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
    };

    const latest = readings[0] || { temperature: 0, humidity: 0 };

    // Calculate chart width based on time span
    const getChartWidth = () => {
        if (readings.length < 2) return '100%';
        const newest = new Date(readings[0].created_at).getTime();
        const oldest = new Date(readings[readings.length - 1].created_at).getTime();
        const durationHours = (newest - oldest) / (1000 * 60 * 60);

        // If duration > 24h, maintain a scale where 24h fills the view
        // If duration <= 24h, stretch to fill the view ("useful width")
        return durationHours > 24 ? `${(durationHours / 24) * 100}%` : '100%';
    };

    return (
        <div className="min-h-screen p-8 text-foreground transition-colors duration-500">

            {/* Header */}
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#2563eb] to-[#6366f1] dark:from-[#60a5fa] dark:to-[#5eead4] drop-shadow-sm">
                        Weather Station
                    </h1>
                    <p className="text-sm opacity-70 mt-1 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Live Monitoring @Peter's Desk
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2 glass rounded-full hover:bg-white/20 transition disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={cn("transition-spin", loading && "animate-spin")} />
                    </button>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Grid */}
            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

                {/* Temperature Card */}
                <Card className="col-span-1 md:col-span-1 border-l-4 border-l-red-400">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-lg font-medium opacity-80 mb-1">Temperature</p>
                            <h2 className="text-5xl font-bold">{latest.temperature.toFixed(1)}°C</h2>
                        </div>
                        <div className="p-3 bg-red-500/20 rounded-full text-red-500 dark:text-red-300">
                            <Thermometer size={32} />
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-sm opacity-70">
                        <Activity size={16} />
                        <span>Optimal Range</span>
                    </div>
                </Card>

                {/* Humidity Card */}
                <Card className="col-span-1 md:col-span-1 border-l-4 border-l-blue-400">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-lg font-medium opacity-80 mb-1">Humidity</p>
                            <h2 className="text-5xl font-bold">{latest.humidity}%</h2>
                        </div>
                        <div className="p-3 bg-blue-500/20 rounded-full text-blue-500 dark:text-blue-300">
                            <Droplets size={32} />
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-sm opacity-70">
                        <CloudRain size={16} />
                        <span>Comfortable</span>
                    </div>
                </Card>

                {/* Location Card */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 border-l-4 border-l-purple-400">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-lg font-medium opacity-80 mb-1">Location</p>
                            <h2 className="text-5xl font-bold">Chennai</h2>
                        </div>
                        <div className="p-3 bg-purple-500/20 rounded-full text-purple-500 dark:text-purple-300">
                            <Home size={32} />
                        </div>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-sm opacity-70">
                        <Clock size={16} />
                        <span>Last updated: {mounted && lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                    </div>
                </Card>

                {/* Charts */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 h-[400px]">
                    <h3 className="text-xl font-semibold mb-4">Environmental Trends</h3>
                    <div
                        ref={scrollContainerRef}
                        className={cn(
                            "h-[320px] w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent select-none",
                            isDragging ? "cursor-grabbing" : "cursor-grab"
                        )}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                    >
                        <div style={{ width: getChartWidth(), height: '100%', minWidth: '100%' }}>
                            {mounted ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={readings} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f33f5dff" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#dd2d4a" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#587ac3ff" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#48cae4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="created_at"
                                            tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            stroke="currentColor"
                                            className="text-xs opacity-60"
                                        />
                                        <YAxis stroke="currentColor" className="text-xs opacity-60" />
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelFormatter={(label) => new Date(label).toLocaleString()}
                                            wrapperStyle={{ zIndex: 100 }}
                                            allowEscapeViewBox={{ x: true, y: true }}
                                        />
                                        <Area type="monotone" dataKey="humidity" stroke="#48cae4" fillOpacity={1} fill="url(#colorHum)" name="Humidity (%)" />
                                        <Area type="monotone" dataKey="temperature" stroke="#dd2d4a" fillOpacity={1} fill="url(#colorTemp)" name="Temperature (°C)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center opacity-50">Loading Chart...</div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Recent Readings List */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 hover:scale-100 transition-none">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Recent Readings
                    </h3>
                    <div
                        className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20"
                        onScroll={handleScroll}
                    >
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-10">
                                <tr className="text-sm uppercase text-gray-400">
                                    <th className="py-3 px-4 w-[40%] backdrop-blur-xl bg-white/5 shadow-sm rounded-tl-xl border-b border-white/10">Time</th>
                                    <th className="py-3 px-4 w-[20%] backdrop-blur-xl bg-white/5 shadow-sm border-b border-white/10">Temperature</th>
                                    <th className="py-3 px-4 w-[20%] backdrop-blur-xl bg-white/5 shadow-sm border-b border-white/10">Humidity</th>
                                    <th className="py-3 px-4 w-[20%] backdrop-blur-xl bg-white/5 shadow-sm rounded-tr-xl border-b border-white/10">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {readings.slice(0, visibleCount).map((reading) => (
                                    <tr key={reading.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4 font-mono text-sm">
                                            {mounted ? (() => {
                                                const d = new Date(reading.created_at);
                                                const day = d.toLocaleDateString('en-US', { weekday: 'short' });
                                                const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                                                const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                                return `${day}(${date}) ${time}`;
                                            })() : '...'}
                                        </td>
                                        <td className="py-3 px-4 font-mono">{reading.temperature}°C</td>
                                        <td className="py-3 px-4 font-mono">{reading.humidity}%</td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300">
                                                OK
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

            </main>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CloudRain, Droplets, Thermometer, Wind, RefreshCw, Activity } from 'lucide-react';
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
                .limit(20);

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

    const latest = readings[0] || { temperature: 0, humidity: 0 };

    return (
        <div className="min-h-screen p-8 text-foreground transition-colors duration-500">

            {/* Header */}
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-300 drop-shadow-sm">
                        Weather Station
                    </h1>
                    <p className="text-sm opacity-70 mt-1 flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Live Monitoring
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

                {/* Status / Extra Info */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-1 flex flex-col justify-center items-center text-center">
                    <div className="mb-2 p-4 bg-white/10 rounded-full">
                        <Wind size={40} className="text-teal-500 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-semibold">System Active</h3>
                    <p className="opacity-60 text-sm mt-1">Last updated: {mounted && lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}</p>
                </Card>

                {/* Charts */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 h-[400px]">
                    <h3 className="text-xl font-semibold mb-4">Environmental Trends</h3>
                    <div className="h-[320px] w-full">
                        {mounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[...readings].reverse()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                                        contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', backdropFilter: 'blur(8px)' }}
                                        labelFormatter={(label) => new Date(label).toLocaleString()}
                                    />
                                    <Area type="monotone" dataKey="temperature" stroke="#ef4444" fillOpacity={1} fill="url(#colorTemp)" name="Temperature (°C)" />
                                    <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHum)" name="Humidity (%)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center opacity-50">Loading Chart...</div>
                        )}
                    </div>
                </Card>

                {/* Recent Readings List */}
                <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        Recent Readings
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 text-sm uppercase opacity-60">
                                    <th className="py-3 px-4">Time</th>
                                    <th className="py-3 px-4">Temperature</th>
                                    <th className="py-3 px-4">Humidity</th>
                                    <th className="py-3 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {readings.map((reading) => (
                                    <tr key={reading.id} className="hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-4">
                                            {mounted ? new Date(reading.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
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

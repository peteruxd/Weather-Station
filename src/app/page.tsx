
import WeatherDashboard from '@/components/WeatherDashboard';

export const metadata = {
  title: 'Weather Station Dashboard',
  description: 'Real-time temperature and humidity monitoring',
};

export default function Home() {
  return (
    <main>
      <WeatherDashboard />
    </main>
  );
}

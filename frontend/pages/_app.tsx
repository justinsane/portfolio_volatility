import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Navbar from '../components/Navbar';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-500 to-purple-600'>
      <div className='pb-24 sm:pb-20'>
        <Component {...pageProps} />
      </div>
      <Navbar />
    </div>
  );
}

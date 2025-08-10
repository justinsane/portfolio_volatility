import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Navbar from '../components/Navbar';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <div className='pb-20'>
        <Component {...pageProps} />
      </div>
      <Navbar />
    </>
  );
}

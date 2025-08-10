import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import PortfolioUpload from '../components/PortfolioUpload';

export default function Home() {
  return (
    <>
      <Head>
        <title>Portfolio Volatility Predictor</title>
        <meta
          name='description'
          content='AI-powered portfolio volatility prediction with enhanced risk analysis'
        />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>

      <main className='p-4'>
        <div className='max-w-6xl mx-auto'>
          <div className='bg-white rounded-2xl shadow-2xl overflow-hidden'>
            {/* Header */}
            <div className='bg-gradient-to-r from-gray-800 to-gray-700 text-white p-8 text-center'>
              <div className='flex flex-col items-center mb-4'>
                <Image
                  src='/port_vol_Logo_1.png'
                  alt='Portfolio Volatility Logo'
                  width={80}
                  height={80}
                  className='mb-4'
                />
                <h1 className='text-4xl font-bold mb-2'>
                  Portfolio Volatility Predictor
                </h1>
                <p className='text-lg opacity-90'>
                  🚀 Enhanced AI model with 500+ asset coverage, real-time data
                  integration, and confidence scoring
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className='p-8'>
              <PortfolioUpload />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

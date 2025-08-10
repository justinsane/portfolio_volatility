import React from 'react';
import Head from 'next/head';
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
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className='min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4'>
        <div className='max-w-6xl mx-auto'>
          <div className='bg-white rounded-2xl shadow-2xl overflow-hidden'>
            {/* Header */}
            <div className='bg-gradient-to-r from-gray-800 to-gray-700 text-white p-8 text-center'>
              <h1 className='text-4xl font-bold mb-2'>
                Portfolio Volatility Predictor
              </h1>
              <p className='text-lg opacity-90'>
                🚀 Enhanced AI model with 500+ asset coverage, real-time data
                integration, and confidence scoring
              </p>
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

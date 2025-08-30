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
            <div className='bg-gradient-to-r from-gray-800 to-gray-700 text-white p-4 sm:p-8 text-center'>
              <div className='flex flex-col items-center mb-4'>
                <Image
                  src='/port_vol_Logo_1.png'
                  alt='Portfolio Volatility Logo'
                  width={60}
                  height={60}
                  className='mb-3 sm:mb-4 sm:w-20 sm:h-20'
                />
                <h1 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-2 px-2'>
                  Portfolio Volatility Predictor
                </h1>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm max-w-4xl mx-auto px-2'>
                  <div className='flex items-start space-x-2 text-left'>
                    <span className='text-lg sm:text-xl flex-shrink-0 mt-0.5'>
                      🧠
                    </span>
                    <span>
                      <strong>Enhanced AI Model:</strong> Smarter predictions
                      for your portfolio.
                    </span>
                  </div>
                  <div className='flex items-start space-x-2 text-left'>
                    <span className='text-lg sm:text-xl flex-shrink-0 mt-0.5'>
                      🌍
                    </span>
                    <span>
                      <strong>500+ Asset Coverage:</strong> Comprehensive
                      analysis for diverse holdings.
                    </span>
                  </div>
                  <div className='flex items-start space-x-2 text-left'>
                    <span className='text-lg sm:text-xl flex-shrink-0 mt-0.5'>
                      ⚡
                    </span>
                    <span>
                      <strong>Real-time Data Integration:</strong> Always
                      up-to-date insights.
                    </span>
                  </div>
                  <div className='flex items-start space-x-2 text-left'>
                    <span className='text-lg sm:text-xl flex-shrink-0 mt-0.5'>
                      🛡️
                    </span>
                    <span>
                      <strong>Confidence Scoring:</strong> Understand the
                      reliability of your forecast.
                    </span>
                  </div>
                </div>
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

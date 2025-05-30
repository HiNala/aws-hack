import React, { useEffect } from 'react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import '@/styles/globals.css'

// Import Leaflet CSS on the client side only
import dynamic from 'next/dynamic'

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Import Leaflet CSS only on client side
    if (typeof window !== 'undefined') {
      require('leaflet/dist/leaflet.css')
    }
  }, [])

  return (
    <>
      <Head>
        <title>PyroGuard Sentinel - AI Wildfire Risk Assessment</title>
        <meta name="description" content="AI-powered wildfire risk assessment system for Hawaiian Islands" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp 
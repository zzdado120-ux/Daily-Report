// Basic Service Worker for PWA Home Screen Installation & Offline Readiness
const CACHE_NAME = 'daily-report-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle normal requests
});

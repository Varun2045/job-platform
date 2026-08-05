/**
 * Datadog APM Configuration for Job Platform
 * 
 * This file configures the Datadog tracing agent for monitoring
 * application performance, distributed tracing, and infrastructure metrics.
 */

import tracer from 'dd-trace';

tracer.init({
  env: process.env.NODE_ENV || 'production',
  service: 'job-platform-backend',
  version: '2.1.0',
  
  // Enable tracing
  logInjection: true,
  
  // Remote configuration
  runtimeMetrics: true,
  
  // Tracing configuration
  tracePropagationStyle: [
    'datadog',
    'tracecontext',
  ],
  
  // Service configuration
  site: process.env.DATADOG_SITE || 'datadoghq.com',
});

export default tracer;

import * as cron from 'node-cron';
import moment from 'moment-timezone';
import WinstonLogger from './logger/logger.js';

const nepaliTimeToSystemTime = (hr: number, min: number): { hour: number; minute: number } => {
  const iso = moment.tz('Asia/Kathmandu').hour(hr).minute(min).second(0).toISOString();
  const system = moment(iso);
  return { hour: system.hour(), minute: system.minute() };
};

const nepal = (hr: number = 0, min: number = 0, day?: string) => {
  const { hour, minute } = nepaliTimeToSystemTime(hr, min);
  return `${minute} ${hour} * * ${day || '*'}`;
};

// Define your cron jobs
export const startCronJobs = () => {
  cron.schedule('*/10 * * * *', () => {
    WinstonLogger.info('This 10-minute cron job runs now', moment.utc().toISOString());
  });

  cron.schedule(nepal(18, 30), () => {
    WinstonLogger.info('This Nepal time-based cron runs now', moment.utc().toISOString());
  });
};
module.exports = {
   apps: [
      {
         name: 'app1',
         script: './app.js',
         watch: true,
         max_memory_restart: '300M',
         exp_backoff_restart_delay: 100,
         cron_restart: '0 0 * * *',
      },
   ],
};

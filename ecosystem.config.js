module.exports = {
   apps: [
      {
         name: 'app1',
         script: './app.js',
         watch: true,
         max_memory_restart: '200M',
         exp_backoff_restart_delay: 100,
         cron_restart: '9 17 * * *',
      },
   ],
};

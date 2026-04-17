const { exec } = require('child_process');

console.log('Testing bot startup...');

exec('npm start', (error, stdout, stderr) => {
    if (error) {
        console.error('Bot failed to start:', error.message);
        process.exit(1);
    }
    if (stderr) {
        console.error('Startup error:', stderr);
        process.exit(1);
    }
    console.log('Bot started successfully!');
    console.log('Test completed.');
    process.exit(0);
});
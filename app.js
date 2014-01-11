var monitored_child_process = require('./monitored_child_process.js'),

    START_PORT = 3000,
    NUM_CHILDREN = 2;

// Start the child threads
for (var i = 0; i < NUM_CHILDREN; i++) {
    monitored_child_process.spawnMonitoredChild('child.js', START_PORT + i, function() { return true; });
}
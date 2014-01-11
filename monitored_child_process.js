var child_process = require('child_process'),
    _ = require('underscore');

exports.spawnMonitoredChild = function(script, port, healthCheck) {
    var respawn = function() {
        var child = child_process.spawn(process.execPath, [ script ], { env: _.extend({ LISTEN_PORT: port }, process.env) }),
            timer = null,
            timerCallback = function() {
                var healthy = healthCheck(port);
                if (healthy) {
                    console.log(port + ' is healthy');
                } else {
                    console.error(port, ' is sick');
                    child.kill();
                }
                timer = setTimeout(timerCallback, 60 * 1000)
            };

        console.log('Child started on port #', port, ' with PID #', child.pid);
        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);

        child.on('exit', function(code, signal) {
            clearTimeout(timer);
            console.error(port + ' exited with status code ' + code + ', signal ' + signal + '. Respawning...');
            respawn();
        });

        process.on('exit', function(code, signal) {
            console.log('exiting');
            child.exit();
        });

        timerCallback();

    }
    respawn();
}
<?php

require('DriverException.php');
require('Driver.php');

try {
	if ( php_sapi_name() !== 'cli' ) {
		exit('Run me from the command line');
	}

	$url = !empty($argv[1]) ? $argv[1] : '';

	if ( !$url ) {
		echo "Usage: php {$argv[0]} <url>\n";

		exit(0);
	}

	$driver = new Driver;

	$detectedApps = $driver->analyze($url);

	if ( $detectedApps ) {
		echo implode("\n", $detectedApps) . "\n";
	} else {
		echo "No applications detected\n";
	}

	exit(0);
} catch ( Exception $e ) {
	echo $e->getMessage() . "\n";

	exit(1);
}

<?php

require('DriverException.php');
require('Driver.php');

try {
	$driver = new Driver;

	$options = getopt("abc");
	var_dump($argv);
	exit;

	$detectedApps = $driver->analyze('http://wappalyzer.com');

	echo implode("\n", $detectedApps) . "\n";

	exit(1);
} catch ( DriverException $e ) {
	exit('x');
	echo $e->getMessage() . "\n";

	exit(0);
}

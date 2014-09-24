<?php

date_default_timezone_set('UTC');

$CONFIG_FILE = '../conf/config.ini';

// Initial configuration stuff
if (!file_exists($CONFIG_FILE)) {
	print "$CONFIG_FILE not found. Please configure the application " .
			'before trying to set up the database. Configuration can be ' .
			"done as part of the installation process.\n";
	exit(-1);
}

include_once 'install-funcs.inc.php';
include_once '../conf/config.inc.php';

$dataDirectory = configure('DATA_DIR', $CONFIG['DATA_DIR'],
		'Enter directory where observatory files can be located');

if (!file_exists($dataDirectory)) {
	print "\tThe indicated directory does not exist. Please try again.\n";
	exit(-1);
}

include_once 'classes/ObservationFileParser.class.php';
$parser = new ObservationFileParser($OBSERVATORY_FACTORY);

$files = recursiveGlob($dataDirectory, '*.bns');
$errorCount = 0;

foreach ($files as $file) {
	$warnings = array();

	try {
		$observation = $parser->parse($file, $warnings);
		$OBSERVATION_FACTORY->createObservation($observation);
	} catch (Exception $e) {
		$warnings[] = $e->getMessage();
	}

	if (count($warnings) !== 0) {
		$errorCount += 1;
		print "The following warnings occurred while processing file '${file}'\n  ";
		print implode("\n  ", $warnings) . "\n";
	}
}

// Show an error summary in case user wasn't watching too closely.
print "\nProcessed " . count($files) . " files with " . $errorCount .
		" errors.";

if ($errorCount !== 0) {
	print " See above for details.\n";
} else {
	print "\n";
}

// ----------------------------------------------------------------------
// Done
// ----------------------------------------------------------------------

print "\nNormal exit.\n";
exit(0);

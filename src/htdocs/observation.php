<?php
if (!isset($TEMPLATE)) {
  include_once '../conf/config.inc.php';
  include_once 'functions.inc.php';

  $id = param('id', 'null');
  if ($id !== 'null') {
    $id = intval($id, 10);
  }

  if ($id > 0) {
    $TITLE = 'Edit Observation';
  } else {
    $TITLE = 'Add New Observation';
  }

  $NAVIGATION = true;
  $HEAD = '<link rel="stylesheet" href="'.$MOUNT_PATH.'/css/observation.css"/>';
  $FOOT =
    '<script>
      var observationId = ' . $id . ';
      var MOUNT_PATH = \'' . $MOUNT_PATH . '\';
      var REALTIME_DATA_URL = \'' . $REALTIME_DATA_URL . '\';
    </script>' .
    '<script src="' . $MOUNT_PATH . '/js/observation.js"></script>';

  include '../lib/login.inc.php';
  include 'template.inc.php';
}
?>

<div class="observation-view-wrapper"></div>

<?php

/**
 *     Have user?      --> Y -->  Redirect to login.php
 *        ↓ Y
 *     define('User', json_encode($user))
 */

if (!isset($TEMPLATE)) {
	include_once '../conf/config.inc.php';
	include_once 'functions.inc.php';

	$TITLE = 'Observatory Overview';

	$HEAD = '<link rel="stylesheet" href="' . $MOUNT_PATH . '/css/index.css"/>';
	$FOOT =
		'<script>
			var MOUNT_PATH = \'' . $MOUNT_PATH .'\';
		</script>' .
		'<script src="' . $MOUNT_PATH . '/js/index.js"></script>';

	include 'template.inc.php';
}
?>

<!-- TODO change this class name to something more appriate and
	start the login process here -->
<div class="observatory-view row"></div>

// <?php
// if (isset($_SESSION['username'])) {
// 		//for testing privileges
// 		if ($_SESSION['username'] == 'emartinez' || $_SESSION['username'] == 'jmfee')  {
// 			if (isset($_GET['sessiontype'])) {
// 				$_SESSION['type'] = $_GET['sessiontype'];
// 			}
// 			if (isset($_GET['sessionuser'])) {
// 				$_SESSION['username'] = $_GET['sessionuser'];
// 			}
// 		}
// 		$LOGGED_IN = true;
// 		$userName = $_SESSION['username'];
// 		$sessionType = $_SESSION['type'];
// 		$type = $sessionType;

// 		if (strstr($_SERVER['QUERY_STRING'], "resetPassword") && !isset($SHOWCONTENT)) {
// 			if (file_exists('/home/www/apps/zzWebAdmin/htdocs/users/user.reset.inc.php')) {
// 				$SCRIPT_FILENAME = '/home/www/apps/zzWebAdmin/htdocs/users/user.reset.inc.php';
// 			} else {
// 				$SCRIPT_FILENAME = $_SERVER['DOCUMENT_ROOT'] . '/admin/users/user.reset.inc.php';
// 			}
// 		}

// 		if (isset($ROLES)) {
// 			requireUserInRoles(explode(',', $ROLES));
// 		}
// 	} else {
// 		$LOGGED_IN = false;
// 		$BODYCLASS = 'one-column';
// 		$SCRIPT_FILENAME = getTemplateFile('static/loginform.inc.php');
// 	}
// ?>
